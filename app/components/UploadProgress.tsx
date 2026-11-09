"use client";

import { Loader2 } from "lucide-react";

/** Badge progres upload: pil kecil berisi persen + bar tipis. */
export function UploadProgress({ fraction }: { fraction: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  return (
    <div className="mt-2 flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70">
        <Loader2 className="size-3.5 animate-spin" />
        Mengunggah {percent}%
        <span className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full bg-white/70 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </span>
      </span>
    </div>
  );
}
