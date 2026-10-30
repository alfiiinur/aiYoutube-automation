"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Film, Trash2, RefreshCw } from "lucide-react";
import { Card, PageHeader, ProgressBar, StatusBadge, EmptyState } from "../../components/ui";
import type { JobStatus, VideoJob } from "../../types";

const FILTERS: { id: "all" | JobStatus; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "analyzing", label: "Analisis" },
  { id: "scripting", label: "Scripting" },
  { id: "rendering", label: "Rendering" },
  { id: "ready", label: "Siap" },
  { id: "failed", label: "Gagal" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [filter, setFilter] = useState<"all" | JobStatus>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await fetch("/api/jobs", { cache: "no-store" }).then((x) => x.json());
    setJobs(r.jobs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const remove = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    await load();
  };

  const retry = async (id: string) => {
    await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
    await load();
  };

  const shown = useMemo(
    () => (filter === "all" ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length };
    for (const j of jobs) c[j.status] = (c[j.status] ?? 0) + 1;
    return c;
  }, [jobs]);

  return (
    <div>
      <PageHeader
        title="Job & Render"
        subtitle="Pantau pipeline: analisis referensi, penyusunan script, hingga render selesai."
        action={
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85"
          >
            <Film className="size-4" /> Job baru
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
              filter === f.id
                ? "border-brand-500/50 bg-brand-500/15 text-white"
                : "border-white/8 bg-white/3 text-white/50 hover:text-white/80"
            }`}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums text-white/35">{counts[f.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/4" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          title={jobs.length === 0 ? "Belum ada job" : "Tidak ada job di filter ini"}
          hint="Buat job baru dari halaman Generate Video."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((job) => (
            <Card key={job.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90 hover:text-white">{job.title}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-white/35">{job.prompt}</p>
                  <p className="mt-1.5 text-[11px] text-white/30">
                    {job.aspectRatio} · {job.durationSec}s · {job.style} · {job.model} ·{" "}
                    {new Date(job.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </Link>

                <div className="flex items-center gap-2">
                  <StatusBadge status={job.status} />
                  <button
                    onClick={() => retry(job.id)}
                    className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-white/80"
                    aria-label="Render ulang"
                    title="Render ulang"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove(job.id)}
                    className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                    aria-label="Hapus job"
                    title="Hapus"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={job.progress} tone={job.status === "ready" ? "lime" : "brand"} />
                <span className="w-9 text-right text-[11px] tabular-nums text-white/40">{job.progress}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
