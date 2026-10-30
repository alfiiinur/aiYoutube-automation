import type { Goal, GoalPlan, GoalPlanItem } from "@/app/types";
import { newId } from "@/app/lib/store";

export const PLAN_MIN = 3;
export const PLAN_MAX = 12;

/** Bentuk item mentah sebelum diberi id & jadwal. */
interface RawItem {
  title: string;
  prompt: string;
  angle?: string;
}

/* ------------------------------------------------------------------ */
/* Perencana lokal (fallback saat API key kosong / AI tak terjangkau)  */
/* ------------------------------------------------------------------ */

interface Angle {
  angle: string;
  title: (topic: string) => string;
  prompt: (topic: string) => string;
}

const ANGLES: Angle[] = [
  {
    angle: "Tutorial",
    title: (t) => `Tutorial ${t} langkah demi langkah`,
    prompt: (t) =>
      `Buat video tutorial vertikal tentang "${t}". Struktur: masalah yang dialami penonton, 3-4 langkah praktis yang mudah diikuti, lalu ajak penonton coba langkah pertama hari ini. Gaya jelas dan memotivasi.`,
  },
  {
    angle: "Kesalahan umum",
    title: (t) => `5 kesalahan soal ${t} + cara memperbaikinya`,
    prompt: (t) =>
      `Buat video fast-cut tentang kesalahan paling umum seputar "${t}" dan cara memperbaikinya satu per satu. Buka dengan hook kuat di 3 detik pertama, tiap poin diberi contoh konkret.`,
  },
  {
    angle: "Studi kasus",
    title: (t) => `Studi kasus nyata: ${t}`,
    prompt: (t) =>
      `Buat video storytelling berisi studi kasus nyata seputar "${t}": kondisi awal, apa yang dilakukan, dan hasilnya. Tutup dengan pelajaran yang bisa ditiru penonton.`,
  },
  {
    angle: "Mitos vs fakta",
    title: (t) => `Mitos vs fakta seputar ${t}`,
    prompt: (t) =>
      `Buat video mitos-vs-fakta tentang "${t}". Angkat 3 mitos populer, patahkan dengan penjelasan singkat berbasis logika, dan tutup dengan satu kesimpulan yang mudah diingat.`,
  },
  {
    angle: "Listicle",
    title: (t) => `7 hal penting tentang ${t}`,
    prompt: (t) =>
      `Buat video listicle "7 hal penting tentang ${t}". Tiap poin satu kalimat padat plus visual pendukung, dengan hook di awal yang menjanjikan poin terakhir paling mengejutkan.`,
  },
  {
    angle: "Behind the scenes",
    title: (t) => `Di balik layar: proses ${t}`,
    prompt: (t) =>
      `Buat video behind-the-scenes yang jujur tentang proses "${t}": tunjukkan persiapan, tantangan di tengah jalan, dan hasil akhirnya. Gaya personal dan apa adanya.`,
  },
  {
    angle: "Perbandingan",
    title: (t) => `Perbandingan jujur: ${t}`,
    prompt: (t) =>
      `Buat video perbandingan seputar "${t}": dua pendekatan berbeda diadu dari sisi kelebihan, kekurangan, dan cocok untuk siapa. Beri rekomendasi tegas di akhir.`,
  },
  {
    angle: "FAQ penonton",
    title: (t) => `Menjawab pertanyaan soal ${t}`,
    prompt: (t) =>
      `Buat video Q&A yang menjawab 3-4 pertanyaan paling sering ditanyakan soal "${t}". Jawab singkat dan praktis, seolah sedang ngobrol dengan penonton.`,
  },
  {
    angle: "Checklist",
    title: (t) => `Checklist cepat sebelum mulai ${t}`,
    prompt: (t) =>
      `Buat video checklist cepat seputar "${t}": 5 hal yang wajib disiapkan sebelum mulai, dengan penjelasan satu kalimat per item. Cocok untuk pemula.`,
  },
  {
    angle: "Cerita",
    title: (t) => `Cerita: perjalanan ${t}`,
    prompt: (t) =>
      `Buat video storytelling personal tentang perjalanan "${t}": titik terendah, titik balik, dan kondisi sekarang. Emosional tapi tetap memberi pelajaran konkret.`,
  },
  {
    angle: "Tips 60 detik",
    title: (t) => `Tips 60 detik: ${t}`,
    prompt: (t) =>
      `Buat satu tips padat 60 detik tentang "${t}": langsung ke inti tanpa basa-basi, satu tips, satu contoh, satu ajakan. Gaya fast-cut penuh energi.`,
  },
  {
    angle: "Rekap",
    title: (t) => `Rangkuman: semua tentang ${t}`,
    prompt: (t) =>
      `Buat video rangkuman seputar "${t}": poin-poin terpenting diringkas jadi satu video padat untuk penonton yang baru pertama kali dengar topik ini.`,
  },
];

/** Bersihkan judul goal (yang sering berupa target, bukan topik) jadi tema konten. */
function topicOf(goal: Goal): string {
  const cleaned = goal.title
    .replace(/^(naikkan|tambah(?:kan)?|capai|tingkatkan|selesaikan|konsisten|kirim(?:kan)?|jadwalkan|buat|bangun|coba|kejar)\s+/i, "")
    .replace(/^(jumlah|target)\s+/i, "")
    .trim();
  return (cleaned || goal.title).slice(0, 80);
}

function localItems(goal: Goal, count: number): RawItem[] {
  const topic = topicOf(goal);
  const out: RawItem[] = [];
  for (let i = 0; i < count; i++) {
    const a = ANGLES[i % ANGLES.length];
    const suffix = i >= ANGLES.length ? ` (bagian ${Math.floor(i / ANGLES.length) + 1})` : "";
    out.push({
      title: `${a.title(topic)}${suffix}`.slice(0, 120),
      prompt: a.prompt(topic),
      angle: a.angle,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Perencana AI (OpenAI / endpoint kompatibel)                         */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = [
  "Kamu perencana konten video berbahasa Indonesia.",
  "Balas HANYA dengan JSON valid tanpa teks lain, format:",
  '{"items":[{"title":"...","prompt":"...","angle":"..."}]}',
  "Aturan: setiap prompt minimal 40 karakter dan siap ditempel ke generator video (jelaskan sudut pandang, struktur, dan gaya).",
  "Variasikan sudut pandangnya (tutorial, studi kasus, mitos, cerita, perbandingan, FAQ, dll).",
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

function parseAiItems(text: string): RawItem[] {
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  const start = clean.search(/[{[]/);
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (start < 0 || end <= start) throw new Error("Respons AI bukan JSON");
  const parsed: unknown = JSON.parse(clean.slice(start, end + 1));
  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed as { items?: unknown; plan?: unknown })?.items ??
      (parsed as { plan?: unknown })?.plan;
  if (!Array.isArray(arr)) throw new Error("Respons AI tidak berisi daftar");
  return arr.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const e = entry as Partial<RawItem>;
    const title = String(e.title ?? "").trim().slice(0, 120);
    const prompt = String(e.prompt ?? "").trim();
    if (title.length < 3 || prompt.length < 20) return [];
    return [{ title, prompt: prompt.slice(0, 1500), angle: String(e.angle ?? "").trim().slice(0, 40) || undefined }];
  });
}

async function aiItems(goal: Goal, count: number): Promise<RawItem[]> {
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
        temperature: 0.8,
        max_tokens: 2600,
        ...(strictJson ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              `Buatkan rencana konten ${count} video untuk goal: "${goal.title}".`,
              `Metrik: ${goal.metric === "posts_sent" ? "postingan terkirim" : "video siap"} (target ${goal.target}).`,
              goal.deadline ? `Deadline: ${goal.deadline.slice(0, 10)}.` : "Tanpa deadline.",
              "Urutkan dari yang paling mudah dibuat ke yang paling ambisius.",
            ].join(" "),
          },
        ],
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Respons AI kosong");
    return parseAiItems(text);
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Perakitan rencana                                                   */
/* ------------------------------------------------------------------ */

function horizonDays(goal: Goal, count: number): number {
  if (goal.deadline) {
    const days = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000);
    if (Number.isFinite(days) && days >= count) return Math.min(120, days);
  }
  return 30;
}

function assemble(goal: Goal, raw: RawItem[], source: GoalPlan["source"], notice?: string): GoalPlan {
  const horizon = horizonDays(goal, raw.length);
  const now = Date.now();
  const items: GoalPlanItem[] = raw.slice(0, PLAN_MAX).map((r, i, arr) => {
    const dayOffset = Math.max(1, Math.round(((i + 1) * horizon) / (arr.length + 1)));
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(9, 0, 0, 0);
    return {
      id: newId("plan"),
      title: r.title,
      prompt: r.prompt,
      angle: r.angle,
      dayOffset,
      scheduledAt: date.toISOString(),
      status: "planned" as const,
    };
  });
  return { items, source, createdAt: now, ...(notice ? { notice } : {}) };
}

/**
 * Susun rencana konten untuk goal: coba AI dulu (kalau ada key),
 * jatuh ke perencana lokal bila AI gagal — selalu dengan catatan.
 */
export async function generatePlan(goal: Goal, count: number): Promise<GoalPlan> {
  const n = Math.max(PLAN_MIN, Math.min(PLAN_MAX, Math.floor(count) || 6));
  const key = process.env.OPENAI_API_KEY?.trim();

  if (key) {
    try {
      const ai = await aiItems(goal, n);
      const topped = ai.length >= n ? ai.slice(0, n) : [...ai, ...localItems(goal, n - ai.length)];
      return assemble(
        goal,
        topped,
        "ai",
        ai.length < n ? "Sebagian item dilengkapi perencana lokal." : undefined,
      );
    } catch (e) {
      const reason = e instanceof Error ? e.message : "tidak diketahui";
      return assemble(
        goal,
        localItems(goal, n),
        "local",
        `AI tidak terjangkau (${reason}), memakai rencana lokal. Periksa OPENAI_API_KEY.`,
      );
    }
  }
  return assemble(goal, localItems(goal, n), "local", "OPENAI_API_KEY kosong — memakai rencana lokal.");
}
