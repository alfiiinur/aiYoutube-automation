"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, ProgressBar, StatusBadge, EmptyState } from "../../../components/ui";
import type { VideoJob } from "../../../types";

export function RecentJobs({ jobs }: { jobs: VideoJob[] }) {
  return (
    <Card className="p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/85">Job terbaru</h2>
        <Link href="/jobs" className="inline-flex items-center gap-1 text-xs text-white/45 hover:text-white">
          Semua job <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="Belum ada job render"
          hint="Mulai dari halaman Generate Video: tulis prompt, tempel link referensi, lalu jalankan pipeline."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="rounded-xl border border-white/6 bg-white/2 p-3.5 transition hover:border-white/12 hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/90">{job.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {job.aspectRatio} · {job.durationSec}s · {job.style} · {job.model}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="mt-3">
                <ProgressBar value={job.progress} tone={job.status === "ready" ? "lime" : "brand"} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
