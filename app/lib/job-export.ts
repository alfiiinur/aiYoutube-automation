/**
 * Export job ke file unduhan (SRT & Markdown).
 *
 * Sengaja mandiri tanpa runtime import agar mudah diuji —
 * cukup penuhi bentuk data minimal di bawah (VideoJob cocok).
 */

export interface ExportScene {
  index: number;
  timecode: string;
  onScreenText: string;
  voiceover: string;
}

export interface ExportJob {
  title: string;
  durationSec: number;
  aspectRatio: string;
  style: string;
  scenes: ExportScene[];
  caption: string;
  hashtags: string[];
  hook: string;
  createdAt: number;
}

/** 00:00:07,000 — format timestamp SRT (HH:MM:SS,mmm). */
export function srtTimestamp(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);
  const p2 = (n: number) => String(n).padStart(2, "0");
  const p3 = (n: number) => String(n).padStart(3, "0");
  return `${p2(h)}:${p2(m)}:${p2(s)},${p3(ms)}`;
}

/**
 * Urai "MM:SS–MM:SS" jadi detik. Jatuh ke pembagian rata bila
 * timecode rusak — semantik yang sama dengan sceneTiming editor.
 */
export function sceneRange(
  timecode: string,
  index: number,
  count: number,
  duration: number,
): { start: number; end: number } {
  const matches = [...String(timecode ?? "").matchAll(/(\d{1,2}):(\d{2})(?:[.,](\d))?/g)];
  if (matches.length >= 2) {
    const toSec = (m: RegExpMatchArray) =>
      Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 10 : 0);
    const start = toSec(matches[0]);
    const end = toSec(matches[1]);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return { start, end: Math.min(end, duration) };
    }
  }
  const per = duration / Math.max(1, count);
  return { start: index * per, end: Math.min(duration, (index + 1) * per) };
}

/** Susun subtitle SRT dari voiceover tiap scene (fallback ke teks layar). */
export function jobToSrt(job: ExportJob): string {
  const duration = Number.isFinite(job.durationSec) && job.durationSec > 0 ? job.durationSec : 60;
  const entries: string[] = [];
  let n = 0;
  job.scenes.forEach((scene, i) => {
    const text = (scene.voiceover || scene.onScreenText || "").trim().replace(/\s+/g, " ");
    if (!text) return;
    const range = sceneRange(scene.timecode, i, job.scenes.length, duration);
    const start = range.start;
    const end = range.end > start ? range.end : Math.min(duration, start + 1);
    n += 1;
    entries.push(`${n}\n${srtTimestamp(start)} --> ${srtTimestamp(end)}\n${text}`);
  });
  return entries.length > 0 ? `${entries.join("\n\n")}\n` : "";
}

/** Susun caption + hashtag + info video sebagai Markdown. */
export function jobToCaptionMd(job: ExportJob): string {
  const lines: string[] = [`# ${job.title || "Tanpa judul"}`, ""];
  if (job.caption.trim()) {
    lines.push(job.caption.trim(), "");
  }
  if (job.hashtags.length > 0) {
    lines.push(job.hashtags.join(" "), "");
  }
  lines.push("---");
  lines.push(`- Format: ${job.aspectRatio} · ${job.durationSec} detik · ${job.style}`);
  if (job.hook.trim()) lines.push(`- Hook: ${job.hook.trim()}`);
  lines.push(
    `- Diekspor: ${new Date(job.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
  );
  return `${lines.join("\n")}\n`;
}

/** "Judul Video!" -> "judul-video" untuk nama file. */
export function slugify(title: string): string {
  const slug = String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "video";
}

/** Unduh teks sebagai file lewat Blob (client-side, tanpa server). */
export function downloadTextFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
