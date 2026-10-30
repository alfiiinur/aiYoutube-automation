"use client";

import { Clock, Hash, Music, Image as ImageIcon } from "lucide-react";
import { Card } from "../../../../components/ui";
import type { VideoJob } from "../../../../types";

export function SummaryCard({ job }: { job: VideoJob }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white/85">Ringkasan</h2>
      <dl className="mt-3 flex flex-col gap-2.5 text-[11.5px]">
        {[
          ["Hook", job.hook],
          ["Thumbnail", job.thumbnailIdea],
          ["Musik", job.musicMood],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-white/35">{k}</dt>
            <dd className="mt-0.5 leading-relaxed text-white/65">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          <Clock className="size-3" /> {job.durationSec} detik · {job.aspectRatio}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          <Music className="size-3" /> {job.musicMood}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          <ImageIcon className="size-3" /> {job.scenes.length} scene storyboard
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/35">
          <Hash className="size-3" /> {job.hashtags.length} hashtag
        </div>
      </div>
    </Card>
  );
}
