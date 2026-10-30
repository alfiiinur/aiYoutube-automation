import type { ContentAnalytics } from "@/app/lib/analytics";

export interface AdviceTip {
  title: string;
  detail: string;
  priority: "tinggi" | "sedang" | "rendah";
}

export interface ContentAdvice {
  source: "ai" | "local";
  summary: string;
  score: number; // 0-100 kesehatan konten
  tips: AdviceTip[];
  nextIdeas: string[];
  notice?: string;
  generatedAt: number;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Skor kesehatan 0-100 dari metrik — dipakai AI maupun fallback lokal. */
export function healthScore(a: ContentAnalytics): number {
  const g = a.growth;
  let score = 40;
  score += Math.min(25, (g.consistency / 100) * 25); // konsistensi upload
  score += Math.min(20, (g.readyRate / 100) * 20); // penyelesaian render
  if (g.trend === "naik") score += 12;
  else if (g.trend === "stabil") score += 6;
  if (g.avgPerDay >= 1) score += 8;
  else if (g.avgPerDay >= 0.5) score += 4;
  if (a.totals.postsSent > 0) score += 5;
  if (a.totals.jobs === 0) score = 10;
  return clamp(score);
}

/* ------------------------- fallback lokal ------------------------- */

function localAdvice(a: ContentAnalytics): ContentAdvice {
  const g = a.growth;
  const tips: AdviceTip[] = [];

  if (a.totals.jobs === 0) {
    return {
      source: "local",
      summary:
        "Belum ada video yang dibuat. Mulai dari 3 video pertama minggu ini agar grafik pertumbuhan punya data untuk dianalisis.",
      score: 10,
      tips: [
        {
          title: "Buat 3 video pertama minggu ini",
          detail:
            "Pilih satu topik yang kamu kuasai, lalu buat 3 sudut pandang: tutorial, kesalahan umum, dan tips 60 detik. Jadwal ideal: Senin–Rabu–Jumat.",
          priority: "tinggi",
        },
        {
          title: "Tambahkan 2–3 link referensi",
          detail:
            "Tempel link YouTube/Instagram/TikTok favoritmu di halaman Referensi agar hook dan struktur script otomatis meniru pola yang terbukti works.",
          priority: "sedang",
        },
        {
          title: "Aktifkan satu automation",
          detail:
            "Buat jadwal produksi otomatis mingguan di halaman Automation supaya konsistensi terjaga tanpa harus ingat manual.",
          priority: "rendah",
        },
      ],
      nextIdeas: [
        "Tutorial topik andalanmu langkah demi langkah",
        "5 kesalahan pemula + cara memperbaikinya",
        "Tips 60 detik yang langsung bisa dipraktikkan",
      ],
      notice: "OPENAI_API_KEY kosong — saran dibuat dari aturan lokal berdasarkan datamu.",
      generatedAt: Date.now(),
    };
  }

  if (g.consistency < 50) {
    tips.push({
      title: "Naikkan konsistensi upload",
      detail: `Kamu aktif ${g.activeDays} dari ${a.rangeDays} hari terakhir (${g.consistency}%). Algoritma menyukai ritme yang bisa ditebak — kunci 2–3 slot tetap per minggu, mis. Selasa & Jumat jam 19.00.`,
      priority: "tinggi",
    });
  } else {
    tips.push({
      title: "Pertahankan ritme — sekarang naikkan kualitas hook",
      detail: `Konsistensi ${g.consistency}% sudah bagus. Fokus berikutnya: 3 detik pertama. Uji 2 varian hook untuk topik yang sama dan bandingkan retensinya.`,
      priority: "sedang",
    });
  }

  if (g.trend === "turun") {
    tips.push({
      title: "Atasi penurunan produksi",
      detail: `Output turun ${Math.abs(g.pctChange)}% dibanding paruh sebelumnya. Batching 3 script dalam 1 sesi generate, lalu render berurutan — lebih ringan daripada mulai dari nol tiap hari.`,
      priority: "tinggi",
    });
  } else if (g.trend === "naik") {
    tips.push({
      title: "Momentum naik — kunci dengan serial",
      detail: `Produksi naik ${g.pctChange}%. Ubah topik terbaik jadi serial ber-part (Part 1, 2, 3) supaya penonton follow untuk lanjutannya.`,
      priority: "sedang",
    });
  }

  if (g.readyRate < 70) {
    tips.push({
      title: "Selesaikan antrean render",
      detail: `${g.readyRate}% video berstatus siap. Cek halaman Jobs untuk yang gagal/macet — render ulang yang penting, hapus yang sudah basi agar pipeline bersih.`,
      priority: "tinggi",
    });
  }

  if (a.totals.postsSent === 0 && a.totals.ready > 0) {
    tips.push({
      title: "Distribusikan video yang sudah siap",
      detail: `Ada ${a.totals.ready} video siap tapi belum ada postingan terkirim. Jadwalkan di halaman Publish — video yang tidak tayang = pertumbuhan nol.`,
      priority: "tinggi",
    });
  }

  const topStyle = a.byStyle[0];
  const styleShare = topStyle && a.totals.jobs ? (topStyle.count / a.totals.jobs) * 100 : 0;
  if (topStyle && styleShare > 65 && a.totals.jobs >= 5) {
    tips.push({
      title: `Variasikan gaya selain "${topStyle.style}"`,
      detail: `${Math.round(styleShare)}% videomu bergaya ${topStyle.style}. Coba 1–2 video bergaya fast-cut atau storytelling bulan ini untuk menemukan format dengan retensi terbaik.`,
      priority: "sedang",
    });
  }

  if (a.avgDurationSec > 0 && (a.avgDurationSec < 25 || a.avgDurationSec > 150)) {
    tips.push({
      title: a.avgDurationSec < 25 ? "Perpanjang sedikit durasi" : "Padatkan durasi video",
      detail:
        a.avgDurationSec < 25
          ? `Rata-rata ${a.avgDurationSec} detik — terlalu pendek untuk menjelaskan nilai. Coba 30–60 detik dengan struktur hook → isi → CTA.`
          : `Rata-rata ${a.avgDurationSec} detik — berisiko drop-off di Shorts/Reels. Pangkas ke 45–60 detik, satu video satu pesan.`,
      priority: "rendah",
    });
  }

  if (g.bestDay) {
    tips.push({
      title: `Ulangi pola hari terbaik (${g.bestDay.label})`,
      detail: `Hari ${g.bestDay.label} menghasilkan ${g.bestDay.jobs} video — tertinggi dalam rentang ini. Catat apa yang berbeda hari itu (waktu, topik, mood) dan jadikan template batching.`,
      priority: "rendah",
    });
  }

  if (a.topHashtags.length > 0) {
    const tags = a.topHashtags
      .slice(0, 3)
      .map((t) => t.tag)
      .join(" ");
    tips.push({
      title: "Bangun pilar hashtag",
      detail: `Hashtag terseringmu: ${tags}. Jadikan 3 pilar konten tetap, lalu tambah 1 hashtag eksperimen baru tiap minggu untuk memperluas jangkauan.`,
      priority: "rendah",
    });
  }

  const summary =
    g.trend === "naik"
      ? `Produksi naik ${g.pctChange}% dengan rata-rata ${g.avgPerDay} video/hari. Proyeksi 7 hari ke depan: +${g.projectedNext7} video kalau ritme ini dipertahankan.`
      : g.trend === "turun"
        ? `Produksi turun ${Math.abs(g.pctChange)}% — rata-rata ${g.avgPerDay} video/hari. Kalau tidak diperbaiki, proyeksi 7 hari ke depan hanya +${g.projectedNext7} video.`
        : `Produksi stabil di ${g.avgPerDay} video/hari dengan konsistensi ${g.consistency}%. Proyeksi 7 hari ke depan: +${g.projectedNext7} video.`;

  const ideas: string[] = [];
  if (topStyle) ideas.push(`Serial 3 part bergaya ${topStyle.style} dari topik terbaikmu`);
  if (a.topHashtags[0]) ideas.push(`Video "kesalahan umum" seputar ${a.topHashtags[0].tag}`);
  ideas.push("Video Q&A: jawab 3 pertanyaan penonton tersering");
  if (g.trend !== "naik") ideas.push("Remake video lama dengan hook baru yang lebih kuat");

  return {
    source: "local",
    summary,
    score: healthScore(a),
    tips: tips.slice(0, 5),
    nextIdeas: ideas.slice(0, 4),
    notice: "OPENAI_API_KEY kosong — saran dibuat dari aturan lokal berdasarkan datamu.",
    generatedAt: Date.now(),
  };
}

/* ------------------------- saran AI ------------------------- */

const SYSTEM_PROMPT = [
  "Kamu konsultan pertumbuhan konten video pendek (YouTube Shorts/Reels/TikTok) berbahasa Indonesia.",
  "Balas HANYA JSON valid tanpa teks lain: {\"summary\":\"...\",\"tips\":[{\"title\":\"...\",\"detail\":\"...\",\"priority\":\"tinggi|sedang|rendah\"}],\"nextIdeas\":[\"...\",...]}",
  "Aturan: summary maksimal 2 kalimat dan sebutkan angka proyeksi yang diberikan. tips 3-5 butir, konkret dan bisa dieksekusi minggu ini. nextIdeas 3-4 judul video spesifik dari topik/hashtag yang diberikan. Jangan menyarankan beli followers/ads.",
].join(" ");

function aiEndpoint(): { url: string; model: string; strictJson: boolean } {
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  return {
    url: `${base}/chat/completions`,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    strictJson: base === "https://api.openai.com/v1",
  };
}

function parseAi(text: string): Pick<ContentAdvice, "summary" | "tips" | "nextIdeas"> {
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  const start = clean.search(/[{[]/);
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (start < 0 || end <= start) throw new Error("Respons AI bukan JSON");
  const parsed = JSON.parse(clean.slice(start, end + 1)) as {
    summary?: unknown;
    tips?: unknown;
    nextIdeas?: unknown;
  };
  const summary = String(parsed.summary ?? "").trim();
  if (!summary) throw new Error("Respons AI kosong");
  const tips = (Array.isArray(parsed.tips) ? parsed.tips : []).flatMap((t): AdviceTip[] => {
    if (!t || typeof t !== "object") return [];
    const e = t as Partial<AdviceTip>;
    const title = String(e.title ?? "").trim().slice(0, 90);
    const detail = String(e.detail ?? "").trim().slice(0, 500);
    if (title.length < 3 || detail.length < 10) return [];
    const p = String(e.priority ?? "").toLowerCase();
    return [{ title, detail, priority: p === "tinggi" || p === "rendah" ? p : "sedang" }];
  });
  const nextIdeas = (Array.isArray(parsed.nextIdeas) ? parsed.nextIdeas : [])
    .map((s) => String(s ?? "").trim().slice(0, 120))
    .filter((s) => s.length >= 5);
  if (tips.length === 0) throw new Error("Respons AI tanpa tips");
  return { summary: summary.slice(0, 400), tips: tips.slice(0, 5), nextIdeas: nextIdeas.slice(0, 4) };
}

async function aiAdvice(a: ContentAnalytics): Promise<ContentAdvice> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("API key kosong");
  const { url, model, strictJson } = aiEndpoint();
  const g = a.growth;

  const brief = [
    `Total ${a.totals.jobs} video (${a.totals.ready} siap), ${a.totals.postsSent} postingan terkirim.`,
    `Rentang ${a.rangeDays} hari: rata-rata ${g.avgPerDay}/hari, konsistensi ${g.consistency}%, ready rate ${g.readyRate}%, tren ${g.trend} (${g.pctChange}%).`,
    `Harian: ${a.series.map((p) => `${p.label}:${p.jobs}`).join(", ")}.`,
    `Proyeksi 7 hari ke depan kalau ritme berlanjut: +${g.projectedNext7} video (total kumulatif ${g.projectedCumulative}).`,
    `Gaya dominan: ${a.byStyle.map((s) => `${s.style}(${s.count})`).join(", ") || "-"}.`,
    `Hashtag top: ${a.topHashtags.map((t) => t.tag).join(" ") || "-"}. Rata-rata durasi ${a.avgDurationSec}s.`,
    g.bestDay ? `Hari terbaik: ${g.bestDay.label} (${g.bestDay.jobs} video).` : "",
  ].join(" ");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 1500,
        ...(strictJson ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Data kanal:\n${brief}\n\nBeri analisis singkat + tips minggu ini.` },
        ],
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Respons AI kosong");
    const parsed = parseAi(text);
    return { source: "ai", score: healthScore(a), generatedAt: Date.now(), ...parsed };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateAdvice(a: ContentAnalytics): Promise<ContentAdvice> {
  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      return await aiAdvice(a);
    } catch (e) {
      const reason = e instanceof Error ? e.message : "tidak diketahui";
      const fallback = localAdvice(a);
      return { ...fallback, notice: `AI tidak terjangkau (${reason}) — memakai saran lokal sementara.` };
    }
  }
  return localAdvice(a);
}
