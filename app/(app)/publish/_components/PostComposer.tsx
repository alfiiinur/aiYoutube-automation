"use client";

import { Loader2, Send, CalendarClock, CalendarDays } from "lucide-react";
import { Card } from "../../../components/ui";
import type { SocialPlatform } from "../../../types";
import { PLATFORMS } from "../_lib/constants";
import type { usePostComposer } from "../_hooks/usePostComposer";

type Composer = ReturnType<typeof usePostComposer>;

export function PostComposer({ composer }: { composer: Composer }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white/85">Buat postingan</h2>
      <p className="mt-1 text-[11px] text-white/40">Konten diambil dari job berstatus Siap.</p>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label className="text-[11px] text-white/45">Job video</label>
          <select value={composer.jobId} onChange={(e) => composer.onSelectJob(e.target.value)} className="input-base mt-1.5">
            <option value="" className="bg-ink-900">
              {composer.readyJobs.length === 0 ? "Belum ada job siap" : "— pilih job —"}
            </option>
            {composer.readyJobs.map((j) => (
              <option key={j.id} value={j.id} className="bg-ink-900">
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-white/45">Platform tujuan</label>
            <select value={composer.platform} onChange={(e) => composer.setPlatform(e.target.value as SocialPlatform)} className="input-base mt-1.5">
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id} className="bg-ink-900">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/45">Jadwal tayang</label>
            <button
              type="button"
              onClick={() => composer.setScheduleOpen(true)}
              className="input-base mt-1.5 flex w-full items-center justify-between gap-2 text-left"
            >
              <span className={composer.scheduledAt ? "text-white/80" : "text-white/35"}>
                {composer.scheduledAt
                  ? new Date(composer.scheduledAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                  : "Pilih tanggal & jam"}
              </span>
              <CalendarDays className="size-4 shrink-0 text-white/35" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-white/45">Caption</label>
          <textarea value={composer.caption} onChange={(e) => composer.setCaption(e.target.value)} rows={3} placeholder="Caption akan terisi otomatis dari job terpilih." className="input-base mt-1.5 resize-y" />
        </div>

        <div>
          <label className="text-[11px] text-white/45">Hashtags (pisahkan dengan spasi)</label>
          <input value={composer.hashtags} onChange={(e) => composer.setHashtags(e.target.value)} placeholder="tips konten viral shorts" className="input-base mt-1.5" />
        </div>

        {composer.selectedJob && (
          <p className="rounded-lg bg-white/4 px-2.5 py-1.5 text-[11px] text-white/35">
            Durasi {composer.selectedJob.durationSec}s · {composer.selectedJob.aspectRatio} · {composer.selectedJob.style}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => composer.createPost(false)}
            disabled={composer.busyPost}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
          >
            {composer.busyPost ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
            Jadwalkan
          </button>
          <button
            onClick={() => composer.createPost(true)}
            disabled={composer.busyPost}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {composer.busyPost ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post sekarang
          </button>
        </div>
      </div>
    </Card>
  );
}
