/**
 * Generator ide prompt video dari sebuah topik.
 *
 * Coba AI dulu (OpenAI / endpoint kompatibel via OPENAI_API_KEY,
 * OPENAI_BASE_URL, OPENAI_MODEL) lalu jatuh ke peracik lokal —
 * halaman selalu dapat hasil walau tanpa API key.
 */

export interface PromptIdea {
  title: string;
  prompt: string;
  angle?: string;
}

export interface PromptIdeasResult {
  ideas: PromptIdea[];
  source: "ai" | "local";
  notice?: string;
}

export const PROMPT_IDEAS_MIN = 3;
export const PROMPT_IDEAS_MAX = 8;
export const PROMPT_IDEAS_DEFAULT = 5;

export function clampCount(count: unknown): number {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n)) return PROMPT_IDEAS_DEFAULT;
  return Math.min(PROMPT_IDEAS_MAX, Math.max(PROMPT_IDEAS_MIN, n));
}

/* ------------------------------------------------------------------ */
/* Peracik lokal                                                       */
/* ------------------------------------------------------------------ */

interface Angle {
  angle: string;
  title: (topic: string) => string;
  prompt: (topic: string) => string;
}

const ANGLES: Angle[] = [
  {
    angle: "Tutorial",
    title: (t) => `Cara ${t} untuk pemula dalam 60 detik`,
    prompt: (t) =>
      `Buatkan video tutorial singkat tentang ${t} untuk pemula: buka dengan masalah yang familiar, ` +
      `jelaskan 3 langkah inti dengan contoh konkret, tutup dengan ajakan praktik hari ini. Gaya bahasa santai dan memotivasi.`,
  },
  {
    angle: "Mitos vs fakta",
    title: (t) => `3 mitos ${t} yang masih dipercaya banyak orang`,
    prompt: (t) =>
      `Buatkan video mitos vs fakta tentang ${t}: sebutkan 3 mitos populer, patahkan satu per satu dengan penjelasan sederhana, ` +
      `tutup dengan fakta paling mengejutkan sebagai hook komentar. Gaya tegas dan edukatif.`,
  },
  {
    angle: "Studi kasus",
    title: (t) => `Studi kasus: hasil nyata menerapkan ${t}`,
    prompt: (t) =>
      `Buatkan video studi kasus tentang ${t}: ceritakan kondisi awal, strategi yang dipakai, dan hasil akhirnya dengan angka ilustratif. ` +
      `Akhiri dengan pelajaran yang bisa ditiru penonton. Gaya storytelling dokumenter ringan.`,
  },
  {
    angle: "Perbandingan",
    title: (t) => `${t}: bandingkan 2 pendekatan ini sebelum mulai`,
    prompt: (t) =>
      `Buatkan video perbandingan 2 pendekatan dalam ${t}: jelaskan kelebihan dan kekurangan masing-masing dengan contoh, ` +
      `beri rekomendasi jelas untuk pemula dan yang sudah lanjut. Gaya analitis tapi mudah dicerna.`,
  },
  {
    angle: "Cerita",
    title: (t) => `Cerita di balik ${t} yang jarang dibahas`,
    prompt: (t) =>
      `Buatkan video storytelling tentang ${t}: angkat sisi personal yang jarang dibahas, bangun konflik kecil lalu resolusi, ` +
      `tutup dengan pesan yang relatable. Gaya hangat seperti ngobrol dengan teman.`,
  },
  {
    angle: "Listicle",
    title: (t) => `7 hal penting soal ${t} yang wajib kamu tahu`,
    prompt: (t) =>
      `Buatkan video listicle 7 poin tentang ${t}: tiap poin satu kalimat inti plus contoh singkat, ` +
      `urutkan dari yang paling dasar ke paling advance. Ritme cepat cocok untuk short video.`,
  },
  {
    angle: "Kesalahan umum",
    title: (t) => `5 kesalahan fatal saat ${t} (dan cara memperbaikinya)`,
    prompt: (t) =>
      `Buatkan video tentang 5 kesalahan umum dalam ${t}: jelaskan tiap kesalahan, kenapa merugikan, dan cara memperbaikinya ` +
      `dengan langkah praktis. Buka dengan hook "berhenti lakukan ini". Gaya direct dan to-the-point.`,
  },
  {
    angle: "Behind the scenes",
    title: (t) => `Di balik layar: proses ${t} dari nol`,
    prompt: (t) =>
      `Buatkan video behind the scenes tentang proses ${t} dari nol: tunjukkan tahap persiapan, eksekusi, dan hasilnya, ` +
      `selipkan tips kecil yang hanya diketahui praktisi. Gaya vlog autentik tanpa polesan berlebihan.`,
  },
];

function cleanTopic(topic: string): string {
  return topic.trim().replace(/\s+/g, " ").slice(0, 120);
}

function localIdeas(topic: string, count: number): PromptIdea[] {
  const t = cleanTopic(topic) || "topik ini";
  return ANGLES.slice(0, count).map((a) => ({
    title: a.title(t).slice(0, 120),
    prompt: a.prompt(t).slice(0, 1500),
    angle: a.angle,
  }));
}

/* ------------------------------------------------------------------ */
/* Generator AI (OpenAI / endpoint kompatibel)                         */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = [
  "Kamu peracik ide konten video berbahasa Indonesia.",
  "Balas HANYA dengan JSON valid tanpa teks lain, format:",
  '{"ideas":[{"title":"...","prompt":"...","angle":"..."}]}',
  "Aturan: setiap prompt minimal 40 karakter dan siap ditempel ke generator video (jelaskan sudut pandang, struktur, dan gaya).",
  "Variasikan sudut pandangnya (tutorial, mitos, studi kasus, perbandingan, cerita, listicle, FAQ, dll).",
  "Judul maksimal 90 karakter.",
].join(" ");

function aiEndpoint(): { url: string; model: string; strictJson: boolean } {
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  return {
    url: `${base}/chat/completions`,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    strictJson: base === "https://api.openai.com/v1",
  };
}

function parseAiIdeas(text: string): PromptIdea[] {
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  const start = clean.search(/[{[]/);
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (start < 0 || end <= start) throw new Error("Respons AI bukan JSON");
  const parsed: unknown = JSON.parse(clean.slice(start, end + 1));
  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed as { ideas?: unknown; items?: unknown })?.ideas ?? (parsed as { items?: unknown })?.items;
  if (!Array.isArray(arr)) throw new Error("Respons AI tidak berisi daftar");
  return arr.flatMap((entry): PromptIdea[] => {
    if (!entry || typeof entry !== "object") return [];
    const e = entry as Partial<PromptIdea>;
    const title = String(e.title ?? "").trim().slice(0, 120);
    const prompt = String(e.prompt ?? "").trim();
    if (title.length < 3 || prompt.length < 20) return [];
    const idea: PromptIdea = { title, prompt: prompt.slice(0, 1500) };
    const angle = String(e.angle ?? "").trim().slice(0, 40);
    if (angle) idea.angle = angle;
    return [idea];
  });
}

async function aiIdeas(topic: string, count: number): Promise<PromptIdea[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("API key kosong");
  const { url, model, strictJson } = aiEndpoint();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 2600,
        ...(strictJson ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Buatkan ${count} ide prompt video tentang: "${topic}". Urutkan dari yang paling mudah dibuat.` },
        ],
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Respons AI kosong");
    const ideas = parseAiIdeas(text);
    if (ideas.length === 0) throw new Error("Respons AI tidak berisi ide valid");
    return ideas.slice(0, count);
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* API utama                                                           */
/* ------------------------------------------------------------------ */

/** Susun ide prompt: coba AI dulu, jatuh ke peracik lokal bila gagal. */
export async function generatePromptIdeas(topic: string, count: number): Promise<PromptIdeasResult> {
  const clean = cleanTopic(topic);
  const n = clampCount(count);
  const key = process.env.OPENAI_API_KEY?.trim();

  if (key) {
    try {
      const ideas = await aiIdeas(clean, n);
      return { ideas, source: "ai" };
    } catch (e) {
      return {
        ideas: localIdeas(clean, n),
        source: "local",
        notice: `AI gagal (${e instanceof Error ? e.message : "tidak diketahui"}), memakai peracik lokal.`,
      };
    }
  }
  return {
    ideas: localIdeas(clean, n),
    source: "local",
    notice: "OPENAI_API_KEY belum diisi — memakai peracik lokal. Isi kunci untuk hasil AI.",
  };
}
