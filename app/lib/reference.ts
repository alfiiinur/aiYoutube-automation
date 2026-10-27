import type { ReferenceSource } from "@/app/types";

export function detectPlatform(url: string): ReferenceSource["platform"] {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  return "web";
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

async function fetchWithTimeout(url: string, ms = 7000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
      },
    });
  } finally {
    clearTimeout(t);
  }
}

function meta(html: string, prop: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decode(m[1]);
  }
  return undefined;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Heuristic creative analysis derived from the source metadata. */
function deriveInsights(r: {
  platform: ReferenceSource["platform"];
  title: string;
  description?: string;
  durationHint?: string;
}): { insights: string[]; tags: string[] } {
  const insights: string[] = [];
  const blob = `${r.title} ${r.description ?? ""}`.toLowerCase();

  const isShort = r.platform !== "web" && (blob.includes("short") || blob.includes("reel") || blob.includes("tiktok"));
  insights.push(
    isShort
      ? "Format vertikal pendek: hook wajib muncul sebelum detik ke-3."
      : "Format lanskap: gunakan cold-open 5 detik lalu intro singkat.",
  );

  if (/(tutorial|cara|how to|tips|guide)/.test(blob))
    insights.push("Struktur problem → solusi → hasil. Cocok untuk seri edukasi bertahap.");
  if (/(vlog|day in|story|cerita|pengalaman)/.test(blob))
    insights.push("Alur naratif personal; pertahankan pacing emosional dan b-roll candid.");
  if (/(review|unboxing|comparison|vs)/.test(blob))
    insights.push("Pola review: ekspektasi → demo → verdict. Tambahkan tabel skor di akhir.");
  if (/(top \d|ranking|best|terbaik)/.test(blob))
    insights.push("Format listicle: setiap poin butuh 1 payoff visual yang jelas.");

  const words = r.title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 3);
  const tags = Array.from(new Set(words.map((w) => w.toLowerCase()))).slice(0, 6);

  if (r.durationHint) insights.push(`Durasi sumber ${r.durationHint} — pakai sebagai acuan pacing cut.`);
  insights.push("Ambil pola hook & transisi saja, bukan aset berhak cipta. Buat ulang visual dari nol.");

  return { insights, tags };
}

export async function analyzeReference(url: string): Promise<Omit<ReferenceSource, "id" | "createdAt">> {
  const platform = detectPlatform(url);
  let title = url;
  let author: string | undefined;
  let thumbnail: string | undefined;
  let description: string | undefined;
  let durationHint: string | undefined;

  try {
    if (platform === "youtube") {
      const id = youtubeId(url);
      if (id) {
        const res = await fetchWithTimeout(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
        );
        if (res.ok) {
          const j = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
          title = j.title ?? title;
          author = j.author_name;
          thumbnail = j.thumbnail_url;
        }
      }
    }

    if (!thumbnail || !description) {
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const html = (await res.text()).slice(0, 400_000);
        title = meta(html, "og:title") ?? meta(html, "title") ?? title;
        description = meta(html, "og:description") ?? meta(html, "description") ?? description;
        thumbnail = meta(html, "og:image") ?? thumbnail;
        author = meta(html, "og:site_name") ?? author;
        durationHint = meta(html, "video:duration") ? `${meta(html, "video:duration")}s` : durationHint;
      }
    }
  } catch {
    // Offline or blocked: keep the URL as title and rely on heuristics.
  }

  const { insights, tags } = deriveInsights({ platform, title, description, durationHint });

  return {
    url,
    platform,
    title: title.slice(0, 200),
    author,
    thumbnail,
    description: description?.slice(0, 600),
    durationHint,
    insights,
    tags,
  };
}