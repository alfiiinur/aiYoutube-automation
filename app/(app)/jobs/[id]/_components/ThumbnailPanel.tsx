"use client";

import { Check, Download, Loader2 } from "lucide-react";
import type { ThumbnailTemplate, VideoJob } from "../../../../types";
import {
  THUMBNAIL_TEMPLATES,
  thumbnailImageUrl,
} from "../../../../lib/thumbnail-templates";
import { storyboardAspectClass } from "../../../../lib/storyboard-image";
import { slugify } from "../../../../lib/job-export";

export function ThumbnailPanel({
  job,
  saving,
  onSelect,
}: {
  job: VideoJob;
  saving: boolean;
  onSelect: (template: ThumbnailTemplate) => void;
}) {
  const coverUrl = thumbnailImageUrl(job, job.thumbnailTemplate, job.scenes.length);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="mx-auto w-full max-w-[280px] shrink-0">
          <img
            src={coverUrl}
            alt={`Cover thumbnail ${job.title}`}
            className={`w-full rounded-xl border border-white/10 bg-ink-950/60 object-cover ${storyboardAspectClass(job.aspectRatio)}`}
          />
          <a
            href={coverUrl}
            download={`${slugify(job.title)}-thumbnail.svg`}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <Download className="size-3" /> Unduh cover (SVG)
          </a>
        </div>

        <div className="grid flex-1 grid-cols-2 content-start gap-2">
          {THUMBNAIL_TEMPLATES.map((t) => {
            const active = job.thumbnailTemplate === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                disabled={saving || active}
                aria-pressed={active}
                title={t.hint}
                className={`group overflow-hidden rounded-xl border text-left transition ${
                  active
                    ? "border-white/40"
                    : "border-white/8 hover:border-white/20"
                } disabled:cursor-default`}
              >
                <div className="relative">
                  <img
                    src={thumbnailImageUrl(job, t.id, job.scenes.length)}
                    alt={`Template ${t.label}`}
                    loading="lazy"
                    className={`w-full object-cover ${storyboardAspectClass(job.aspectRatio)}`}
                  />
                  {active && (
                    <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white text-black">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 bg-white/3 px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/85">{t.label}</p>
                    <p className="truncate text-[10px] text-white/35">{t.hint}</p>
                  </div>
                  {saving && active && <Loader2 className="size-3.5 shrink-0 animate-spin text-white/50" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="rounded-xl border border-white/6 bg-white/2 px-3 py-2 text-[11px] leading-relaxed text-white/40">
        Cover dibuat otomatis dari judul + hook job. Pakai template yang sama di tiap job satu series agar
        semua cover satu tema. Ide cover AI: {job.thumbnailIdea || "—"}
      </p>
    </div>
  );
}
