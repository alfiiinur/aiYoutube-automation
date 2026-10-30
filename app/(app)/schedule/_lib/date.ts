import type { NoteColor, SocialPost } from "../../../types";

export const PLATFORM_LABEL: Record<SocialPost["platform"], string> = {
  threads: "Threads",
  instagram: "Instagram",
  facebook: "Facebook",
};

export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Tanggal lokal YYYY-MM-DD (format yang dipakai API schedule-notes). */
export function toDayString(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const NOTE_STYLES: Record<NoteColor, { card: string; dot: string }> = {
  yellow: { card: "bg-amber-200 text-amber-950", dot: "bg-amber-500" },
  pink: { card: "bg-rose-200 text-rose-950", dot: "bg-rose-500" },
  green: { card: "bg-emerald-200 text-emerald-950", dot: "bg-emerald-500" },
  blue: { card: "bg-sky-200 text-sky-950", dot: "bg-sky-500" },
  purple: { card: "bg-violet-200 text-violet-950", dot: "bg-violet-500" },
};

export const POST_STATUS_STYLE: Record<SocialPost["status"], string> = {
  scheduled: "bg-white/10 text-white/70",
  sent: "bg-white text-black",
  failed: "border border-white/25 bg-transparent text-white/60",
};
