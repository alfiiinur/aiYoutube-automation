"use client";

import Link from "next/link";
import { Download, Music, Clapperboard } from "lucide-react";
import { Card } from "../../../../components/ui";
import type { VideoJob } from "../../../../types";

export function AssetsCard({ job }: { job: VideoJob }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white/85">Aset</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-white/40">
        Susun klip, caption, suara, musik, dan overlay di timeline editor. Ekspor MP4 menunggu provider render
        terhubung di Settings.
      </p>
      {job.media && job.media.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {job.media.map((m, i) => (
            <div key={`${m.url}-${i}`} className="w-20 shrink-0" title={m.name}>
              <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-white/10 bg-ink-950/60">
                {m.kind === "image" ? (
                  <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                ) : m.kind === "video" ? (
                  <video src={m.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <Music className="size-5 text-accent-400" />
                )}
              </div>
              <p className="mt-1 truncate text-[9px] text-white/40">{m.name}</p>
            </div>
          ))}
        </div>
      )}
      <Link
        href={`/jobs/${job.id}/editor`}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[11.5px] font-medium text-black transition hover:bg-white/85"
      >
        <Clapperboard className="size-3.5" /> Buka editor timeline
      </Link>
      <Link
        href={`/jobs/${job.id}/editor?export=1`}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-[11.5px] font-medium text-lime-200 transition hover:bg-lime-400/20"
      >
        <Download className="size-3.5" /> Unduh video
      </Link>
      <Link
        href="/automations"
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11.5px] text-white/70 transition hover:bg-white/10"
      >
        Jadwalkan upload
      </Link>
    </Card>
  );
}
