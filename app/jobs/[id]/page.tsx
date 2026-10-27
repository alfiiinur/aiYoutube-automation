"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Loader2,
  RefreshCw,
  Clock,
  Hash,
  Music,
  Image as ImageIcon,
  Clapperboard,
} from "lucide-react";
import { Card, PageHeader, ProgressBar, StatusBadge } from "../../components/ui";
import type { ReferenceSource, VideoJob } from "../../types";

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      {done ? <Check className="size-3 text-lime-400" /> : <Copy className="size-3" />}
      {done ? "Tersalin" : label}
    </button>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [job, setJob] = useState<VideoJob | null>(null);
  const [refs, setRefs] = useState<ReferenceSource[]>([]);
  const [tab, setTab] = useState<"script" | "storyboard" | "caption">("script");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Job tidak ditemukan");
      return;
    }
    const data = await res.json();
    setJob(data.job);
    setRefs(data.references ?? []);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "script" || hash === "storyboard" || hash === "caption") setTab(hash);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const retry = async () => {
    await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
    load();
  };

  if (error) {
    return (
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white">
          <ArrowLeft className="size-3.5" /> Kembali
        </Link>
        <p className="mt-6 text-sm text-brand-400">{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="grid place-items-center py-24 text-white/40">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const scriptText = `${job.script}\n\n---\nCaption:\n${job.caption}\n\n${job.hashtags.join(" ")}`;

  return (
    <div>
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg shadow-brand-500/20 transition hover:brightness-110"
              >
                <Clapperboard className="size-3" /> Buka editor
              </Link>
              <button
                onClick={retry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="size-3" /> Render ulang
              </button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
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
              <CopyBtn
                text={
                  tab === "script" ? job.script : tab === "caption" ? `${job.caption}\n\n${job.hashtags.join(" ")}` : job.scenes
                      .map((s) => `#${s.index} ${s.timecode}\nVisual: ${s.visual}\nText: ${s.onScreenText}\nVO: ${s.voiceover}`)
                      .join("\n\n")
                }
              />
            </div>

            <div className="mt-4">
              {tab === "script" && (
                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/6 bg-ink-950/60 p-4 text-[12.5px] leading-relaxed text-white/70">
                  {job.script}
                </pre>
              )}

              {tab === "storyboard" && (
                <div className="flex max-h-[520px] flex-col gap-2 overflow-auto pr-1">
                  {job.scenes.map((s) => (
                    <div key={s.index} className="rounded-xl border border-white/8 bg-white/2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-white/80">Scene {s.index}</span>
                        <span className="font-mono text-[10px] text-white/35">{s.timecode}</span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/55">{s.visual}</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-accent-400">“{s.onScreenText}”</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/35">VO: {s.voiceover}</p>
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
        </div>

        <div className="flex flex-col gap-4">
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

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white/85">Referensi dipakai</h2>
            {refs.length === 0 ? (
              <p className="mt-2 text-[11px] text-white/35">
                Job ini dibuat tanpa referensi eksternal — murni dari prompt.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {refs.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/8 bg-white/2 p-2.5 transition hover:border-white/16"
                  >
                    <p className="line-clamp-2 text-[11.5px] font-medium text-white/80">{r.title}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/30">{r.platform}</p>
                  </a>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white/85">Aset</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-white/40">
              Susun klip, caption, suara, musik, dan overlay di timeline editor. Ekspor MP4 menunggu provider render
              terhubung di Settings.
            </p>
            <Link
              href={`/jobs/${job.id}/editor`}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-3 py-2 text-[11.5px] font-medium text-white transition hover:brightness-110"
            >
              <Clapperboard className="size-3.5" /> Buka editor timeline
            </Link>
            <button
              disabled
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11.5px] text-white/35"
            >
              <Download className="size-3.5" /> Unduh MP4 (belum tersedia)
            </button>
            <Link
              href="/automations"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11.5px] text-white/70 transition hover:bg-white/10"
            >
              Jadwalkan upload
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}