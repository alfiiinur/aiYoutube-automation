"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Clapperboard } from "lucide-react";
import { PageHeader, StatusBadge } from "../../../../components/ui";
import type { VideoJob } from "../../../../types";
import { CopyBtn } from "./buttons";

export function JobHeader({ job, onRetry }: { job: VideoJob; onRetry: () => void }) {
  const scriptText = `${job.script}\n\n---\nCaption:\n${job.caption}\n\n${job.hashtags.join(" ")}`;

  return (
    <>
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white">
        <ArrowLeft className="size-3.5" /> Semua job
      </Link>

      <div className="mt-4">
        <PageHeader
          title={job.title}
          subtitle={`${job.aspectRatio} · ${job.durationSec}s · ${job.style} · ${job.model}`}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusBadge status={job.status} />
              <CopyBtn text={scriptText} label="Copy semua" />
              <Link
                href={`/jobs/${job.id}/editor`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-medium text-black transition hover:bg-white/85"
              >
                <Clapperboard className="size-3" /> Buka editor
              </Link>
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="size-3" /> Render ulang
              </button>
            </div>
          }
        />
      </div>
    </>
  );
}
