import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Text-to-speech untuk voice over editor.
 *
 * Urutan provider:
 *   1. ElevenLabs (kalau ELEVENLABS_API_KEY diisi)
 *   2. OpenAI TTS (kalau OPENAI_API_KEY valid / diawali `sk-`)
 *   3. Google Translate TTS (gratis, tanpa key — fallback yang selalu tersedia)
 */

type CacheEntry = { audio: Buffer; type: string; at: number };

const cache = new Map<string, CacheEntry>();
const MAX_CACHE = 160;
const MAX_TEXT = 1500;

function cacheGet(key: string): CacheEntry | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  /* refresh LRU position */
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function cacheSet(key: string, entry: CacheEntry) {
  cache.set(key, entry);
  while (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function langFor(voice: string): "id" | "en" {
  const v = voice.toLowerCase();
  if (v.endsWith("-en") || v.includes("english") || v.startsWith("en-")) return "en";
  return "id";
}

function openAiVoice(voice: string): string {
  const v = voice.toLowerCase();
  if (v.startsWith("male")) return "onyx";
  if (v.startsWith("female")) return "nova";
  return "alloy";
}

function elevenVoice(voice: string): string {
  const v = voice.toLowerCase();
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  /* Sarah — default multilingual voice */
  return v.startsWith("male") ? "TX3LPaxmHKxFdv7VOQHJ" : "EXAVITQu4vr4xnSDxMaL";
}

/** Pecah teks jadi potongan <= `max` karakter di batas kalimat/kata. */
function chunkText(text: string, max = 180): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean ? [clean] : [];

  const chunks: string[] = [];
  let current = "";
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const sentence of clean.split(/(?<=[.!?…])\s+/)) {
    if (sentence.length > max) {
      for (const word of sentence.split(/\s+/)) {
        const next = current ? `${current} ${word}` : word;
        if (next.length > max) {
          push();
          current = word.slice(0, max);
        } else {
          current = next;
        }
      }
      continue;
    }
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > max) {
      push();
      current = sentence;
    } else {
      current = next;
    }
  }
  push();
  return chunks.slice(0, 8);
}

async function elevenLabsTts(text: string, voice: string): Promise<Buffer> {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) throw new Error("ElevenLabs key kosong");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoice(voice)}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function openAiTts(text: string, voice: string): Promise<Buffer> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OpenAI key kosong");

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: openAiVoice(voice),
      input: text,
      response_format: "mp3",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function googleChunk(text: string, lang: "id" | "en"): Promise<Buffer> {
  const url = new URL("https://translate.google.com/translate_tts");
  url.searchParams.set("ie", "UTF-8");
  url.searchParams.set("q", text);
  url.searchParams.set("tl", lang);
  url.searchParams.set("client", "tw-ob");
  url.searchParams.set("ttsspeed", "1");

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      referer: "https://translate.google.com/",
      accept: "audio/mpeg,*/*",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 400) throw new Error("Google TTS mengembalikan audio kosong");
  return buf;
}

async function googleTts(text: string, lang: "id" | "en"): Promise<Buffer> {
  const chunks = chunkText(text);
  const parts: Buffer[] = [];
  for (const chunk of chunks) {
    parts.push(await googleChunk(chunk, lang));
  }
  return Buffer.concat(parts);
}

async function synthesize(text: string, voice: string): Promise<CacheEntry> {
  const lang = langFor(voice);
  const key = `${lang}:${voice}:${text}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const short = text.length <= 500;
  const attempts: Array<() => Promise<Buffer>> = [];

  if (process.env.ELEVENLABS_API_KEY?.trim()) {
    attempts.push(() => elevenLabsTts(text, voice));
  }
  if (process.env.OPENAI_API_KEY?.trim().startsWith("sk-") && short) {
    attempts.push(() => openAiTts(text, voice));
  }
  attempts.push(() => googleTts(text, lang));

  let lastError: unknown = null;
  for (const run of attempts) {
    try {
      const audio = await run();
      if (audio.length < 200) throw new Error("Audio terlalu kecil");
      const entry: CacheEntry = { audio, type: "audio/mpeg", at: Date.now() };
      cacheSet(key, entry);
      return entry;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("TTS gagal");
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

function audioResponse(entry: CacheEntry): NextResponse {
  return new NextResponse(entry.audio as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": entry.type,
      "content-length": String(entry.audio.length),
      "cache-control": "public, max-age=604800, immutable",
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = normalizeText(url.searchParams.get("text"));
  const voice = String(url.searchParams.get("voice") ?? "female-id").slice(0, 40);

  if (!text) {
    return NextResponse.json({ error: "Parameter `text` wajib diisi" }, { status: 400 });
  }

  try {
    const entry = await synthesize(text, voice);
    return audioResponse(entry);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat voice over" },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  let body: { text?: unknown; voice?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const text = normalizeText(body.text);
  const voice = String(body.voice ?? "female-id").slice(0, 40);

  if (!text) {
    return NextResponse.json({ error: "Field `text` wajib diisi" }, { status: 400 });
  }

  try {
    const entry = await synthesize(text, voice);
    return audioResponse(entry);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat voice over" },
      { status: 502 },
    );
  }
}
