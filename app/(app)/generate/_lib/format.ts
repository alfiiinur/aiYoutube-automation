import type { VideoJob } from "../../../types";

export function formatDurationID(sec: number): string {
  if (sec < 60) return `${sec} dtk`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m} mnt` : `${m} mnt ${s} dtk`;
}

export function secToMinText(sec: number): string {
  return String(Number((sec / 60).toFixed(2)));
}

export function skillDate(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function chatDot(status: VideoJob["status"]): string {
  if (status === "ready") return "bg-white";
  if (status === "failed") return "bg-white/25";
  return "bg-white/70 animate-pulse";
}
