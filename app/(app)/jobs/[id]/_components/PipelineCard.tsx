"use client";

import { Card, ProgressBar } from "../../../../components/ui";
import type { VideoJob } from "../../../../types";

export function PipelineCard({ job }: { job: VideoJob }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/85">Pipeline</h2>
        <span className="text-[11px] tabular-nums text-white/40">{job.progress}%</span>
      </div>
      <div className="mt-3">
        <ProgressBar value={job.progress} tone={job.status === "ready" ? "lime" : "brand"} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {(["analyzing", "scripting", "rendering", "ready"] as const).map((s, i) => {
          const order = ["analyzing", "scripting", "rendering", "ready"];
          const current = order.indexOf(job.status);
          const done = current > i || job.status === "ready";
          return (
            <div
              key={s}
              className={`rounded-lg border px-2 py-1.5 text-center text-[10px] capitalize transition ${
                done
                  ? "border-lime-500/30 bg-lime-500/10 text-lime-300"
                  : current === i
                    ? "border-brand-500/40 bg-brand-500/10 text-white"
                    : "border-white/8 bg-white/2 text-white/35"
              }`}
            >
              {s}
            </div>
          );
        })}
      </div>

      <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-white/6 bg-ink-950/60 p-3 font-mono text-[11px] leading-relaxed text-white/45">
        {job.logs.map((l, i) => (
          <div key={i}>
            <span className="text-white/25">{new Date(l.at).toLocaleTimeString("id-ID")}</span> {l.message}
          </div>
        ))}
      </div>
    </Card>
  );
}
