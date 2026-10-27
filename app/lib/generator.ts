import type { ReferenceSource, StoryboardScene, VideoJob } from "@/app/types";

const STYLE_VERBS: Record<string, string> = {
  cinematic: "gerakan kamera lambat, depth of field tipis, color grading teal-orange",
  "fast-cut": "potongan cepat 0.8s, zoom punch, transisi whip-pan",
  documentary: "handheld halus, wawancara talking-head, b-roll faktual",
  "motion-graphic": "kinetic typography, shape transition, lower third bersih",
  anime: "cel-shaded, speed line, dramatisasi sudut rendah",
  "screen-record": "capture layar rapi, highlight kursor, zoom ke elemen kunci",
};

const VOICES: Record<string, string> = {
  "male-id": "pria Indonesia, hangat, tempo sedang",
  "female-id": "wanita Indonesia, energik, artikulasi jelas",
  "male-en": "male English, deep, authoritative",
  "female-en": "female English, friendly, bright",
};

function keywords(text: string): string[] {



    const stop = new Set([
    "yang","dan","untuk","dengan","dari","adalah","akan","bisa","juga","pada","ke","di","ini","itu",
    "video","tentang","mau","pingin","ingin","tolong","gimana","konten","short","shorts","pendek","singkat","membahas","mengenai","mengulas","buatin","buatkan","buat","bikin","bikinin","cara","caraa",
    "the","and","for","with","from","that","this","your","you","about","into","how","what","make","a","an","of","in","on","at","to","please","create",
  ]);
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
                .filter((w) => w.length > 3 && !stop.has(w)),
    ),
  );
}

function titleFromPrompt(prompt: string, seeds: string[]): string {
  // Buang frasa pembuka generik: "video tentang cara memilih mikrofon..." -> "Memilih mikrofon..."
  const lead =
    /^(tolong\s+)?(buatin|buatkan|buat|bikin|bikinin)?\s*(video|konten|short|shorts)?\s*(pendek|singkat)?\s*(tentang|mengenai|membahas|mengulas|cara|gimana)?\s*/i;
  let t = prompt.replace(lead, "").trim();
  if (t.length < 5) t = keywords(prompt)[0] ?? seeds[0] ?? "ide";
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.split(/\s+/).slice(0, 8).join(" ");
}

export function generateJobContent(input: {
  prompt: string;
  references: ReferenceSource[];
  style: string;
  voice: string;
  durationSec: number;
  aspectRatio: string;
  model: string;
}): Pick<
  VideoJob,
  "title" | "hook" | "script" | "caption" | "hashtags" | "scenes" | "thumbnailIdea" | "musicMood"
> {
  const { prompt, references, style, voice, durationSec, aspectRatio } = input;
  const refTags = references.flatMap((r) => r.tags);
  const refInsights = references.flatMap((r) => r.insights);
  const kw = Array.from(new Set([...keywords(prompt), ...refTags])).slice(0, 8);
  const subject = kw[0] ?? "topik";
  const angle = kw[1] ?? "praktik";

  const hookPatterns = [
    `Stop scrolling — 90% orang salah paham soal ${subject}.`,
    `Kalau kamu cuma punya ${Math.max(15, Math.round(durationSec / 3))} detik untuk paham ${subject}, ini rangkumannya.`,
    `${subject} bisa 3x lebih cepat kalau kamu tahu ${angle} yang satu ini.`,
    `Aku uji ${subject} selama 7 hari. Hasilnya di luar dugaan.`,
  ];
  const hook = hookPatterns[Math.floor(prompt.length % hookPatterns.length)];

  const sceneCount = Math.max(3, Math.min(8, Math.round(durationSec / 6)));
  const per = durationSec / sceneCount;
  const visualNote = STYLE_VERBS[style] ?? STYLE_VERBS.cinematic;
  const voiceNote = VOICES[voice] ?? VOICES["female-id"];

  const beats = ["Hook", "Konteks", "Masalah", "Solusi", "Bukti", "Penerapan", "Ringkasan", "CTA"];

  const scenes: StoryboardScene[] = Array.from({ length: sceneCount }, (_, i) => {
    const start = i * per;
    const fmt = (s: number) =>
      `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const beat = beats[i] ?? "Detail";
    return {
      index: i + 1,
      timecode: `${fmt(start)}–${fmt(start + per)}`,
      visual: `${beat}: ${i === 0 ? "talking head close-up + oversized text" : `b-roll ${subject} / ${angle}`}. ${visualNote}. Komposisi ${aspectRatio}.`,
      onScreenText:
        i === 0
          ? hook.slice(0, 60)
          : i === sceneCount - 1
            ? "Follow untuk part berikutnya →"
            : `${beat}: ${kw[i % kw.length] ?? subject}`,
      voiceover:
        i === 0
          ? hook
          : `Poin ${i}: ${kw[i % kw.length] ?? subject} — jelaskan dalam 1 kalimat utuh, lalu beri contoh konkret.`,
      broll: ["screen capture", "close-up produk", "timelapse", "tangan menulis", "grafik bergerak"][i % 5],
    };
  });

  const script = [
    `# ${titleFromPrompt(prompt, kw)}`,
    ``,
    `**Format:** ${aspectRatio} · ${durationSec}s · gaya ${style} · voice ${voiceNote}`,
    `**Hook (0–3s):** ${hook}`,
    ``,
    `## Isi`,
    ...scenes.map((s) => `${s.index}. ${s.timecode} — ${s.onScreenText}\n   VO: ${s.voiceover}`),
    ``,
    `## Catatan produksi`,
    ...(refInsights.length
      ? refInsights.slice(0, 4).map((r) => `- ${r}`)
      : ["- Belum ada referensi. Tambahkan link YouTube/Instagram agar struktur lebih tajam."]),
    `- Aspect ratio ${aspectRatio}; amankan safe-area untuk caption platform.`,
  ].join("\n");

  const caption = [
    `${hook}`,
    ``,
    `Kalau kamu lagi bikin ${subject}, simpan video ini. Poin ${angle}-nya jarang dibahas.`,
    `Mana yang paling relevan buat kamu? Tulis di komentar 👇`,
  ].join("\n");

    const weakTags = new Set([
    "cara","video","tentang","buat","bikin","tips","tutorial","how","to","make",
    "untuk","dan","yang","dari","with","for","your","this",
  ]);
  const hashtags = Array.from(
    new Set([...kw.filter((k) => !weakTags.has(k)).map((k) => k.replace(/\s+/g, "")), "shorts", "fyp"]),
  )
    .slice(0, 8)
    .map((h) => `#${h}`);

  return {
    title: titleFromPrompt(prompt, kw),
    hook,
    script,
    caption,
    hashtags,
    scenes,
    thumbnailIdea: `Close-up ${subject} dengan teks besar 4–6 kata, kontras tinggi, wajah berekspresi di kanan bawah.`,
    musicMood: /\b(tenang|calm|edukasi)\b/i.test(prompt) ? "lo-fi calm, 80 BPM" : "upbeat electronic, 120 BPM, drop di detik 3",
  };
}