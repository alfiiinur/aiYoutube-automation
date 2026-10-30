"use client";

import { Card } from "../../../../components/ui";
import type { VideoJob } from "../../../../types";
import { storyboardImageUrl, storyboardThumbClass } from "../../../../lib/storyboard-image";
import type { JobTab } from "../_hooks/useJobDetail";
import { CopyBtn, DownloadBtn } from "./buttons";

export function ContentTabs({
  job,
  tab,
  setTab,
  onDownloadSrt,
  onDownloadMd,
}: {
  job: VideoJob;
  tab: JobTab;
  setTab: (t: JobTab) => void;
  onDownloadSrt: () => void;
  onDownloadMd: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
          {(["script", "storyboard", "caption"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-[11px] capitalize transition ${
                tab === t ? "bg-white/10 text-white" : "text-white/45 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn
            text={
              tab === "script" ? job.script : tab === "caption" ? `${job.caption}\n\n${job.hashtags.join(" ")}` : job.scenes
                  .map((s) => `#${s.index} ${s.timecode}\nVisual: ${s.visual}\nText: ${s.onScreenText}\nVO: ${s.voiceover}`)
                  .join("\n\n")
            }
          />
          {tab === "script" && (
            <DownloadBtn label="SRT" title="Unduh subtitle (.srt)" disabled={job.scenes.length === 0} onClick={onDownloadSrt} />
          )}
          {tab === "caption" && (
            <DownloadBtn
              label="MD"
              title="Unduh caption (.md)"
              disabled={!job.caption.trim() && job.hashtags.length === 0}
              onClick={onDownloadMd}
            />
          )}
        </div>
      </div>

      <div className="mt-4">
        {tab === "script" && (
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/6 bg-ink-950/60 p-4 text-[12.5px] leading-relaxed text-white/70">
            {job.script}
          </pre>
        )}

        {tab === "storyboard" && (
          <div className="flex max-h-[560px] flex-col gap-3 overflow-auto pr-1">
            {job.scenes.map((s) => (
              <div key={s.index} className="flex gap-3 rounded-xl border border-white/8 bg-white/2 p-3">
                <img
                  src={storyboardImageUrl(job, s, job.scenes.length)}
                  alt={`Storyboard scene ${s.index}: ${s.onScreenText}`}
                  loading="lazy"
                  className={`shrink-0 self-start rounded-lg border border-white/10 bg-ink-950/60 object-cover ${storyboardThumbClass(job.aspectRatio)}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/80">Scene {s.index}</span>
                    <span className="font-mono text-[10px] text-white/35">{s.timecode}</span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/55">{s.visual}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-accent-400">“{s.onScreenText}”</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/35">VO: {s.voiceover}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "caption" && (
          <div className="flex flex-col gap-3">
            <pre className="whitespace-pre-wrap rounded-xl border border-white/6 bg-ink-950/60 p-4 text-[12.5px] leading-relaxed text-white/70">
              {job.caption}
            </pre>
            <div className="flex flex-wrap gap-1.5">
              {job.hashtags.map((h) => (
                <span key={h} className="rounded-full bg-accent-500/12 px-2.5 py-1 text-[11px] text-accent-400">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
