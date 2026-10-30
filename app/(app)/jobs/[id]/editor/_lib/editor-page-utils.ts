import { Clapperboard, Layers, Mic2, Music2, Type } from "lucide-react";
import type { EditorTool } from "@/app/types";

export const TOOL_ITEMS: { id: EditorTool; label: string; icon: typeof Clapperboard }[] = [
  { id: "clip", label: "Klip", icon: Clapperboard },
  { id: "voice", label: "Suara", icon: Mic2 },
  { id: "caption", label: "Caption", icon: Type },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "music", label: "Musik", icon: Music2 },
];

export type Toast = { text: string; tone: "ok" | "error" | "info" };

export function showToastStyle(tone: Toast["tone"]) {
  if (tone === "error") return "border-white/25 bg-[#141416]/95 text-white";
  if (tone === "ok") return "border-white/25 bg-[#141416]/95 text-white";
  return "border-white/12 bg-ink-900/95 text-white/75";
}

export function fileNameTitle(name: string): string {
  return name.replace(/\.[^.]+$/, "").slice(0, 42) || "Media impor";
}

/** Read video/audio duration locally before uploading, so the new clip gets a real length. */
export function probeMediaDuration(file: File): Promise<number> {
  if (file.type.startsWith("image/")) return Promise.resolve(3.5);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (value: number) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      URL.revokeObjectURL(url);
      el.removeAttribute("src");
      el.load();
      resolve(value);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => finish(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 5);
    el.onerror = () => finish(5);
    el.src = url;
    timer = setTimeout(() => finish(5), 8000);
  });
}
