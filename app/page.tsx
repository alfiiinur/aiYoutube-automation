"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Film, Link2, CalendarClock, Timer, ArrowUpRight, Sparkles } from "lucide-react";
import { Card, ProgressBar, StatusBadge, PageHeader, EmptyState } from "./components/ui";
import type { VideoJob } from "./types";

interface Stats {
  totalJobs: number;
  ready: number;
  active: number;
  failed: number;
  references: number;
  automations: number;
  activeAutomations: number;
  byPlatform: Record<string, number>;
  totalSeconds: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<VideoJob[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [s, j] = await Promise.all([
        fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/jobs", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!alive) return;
      setStats(s.stats);
      setJobs(j.jobs.slice(0, 4));
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const tiles = [
    { label: "Total job", value: stats?.totalJobs ?? 0, icon: Film, tone: "text-sky-300" },
    { label: "Video siap", value: stats?.ready ?? 0, icon: Sparkles, tone: "text-lime-300" },
    { label: "Referensi", value: stats?.references ?? 0, icon: Link2, tone: "text-accent-400" },
    { label: "Automation aktif", value: stats?.activeAutomations ?? 0, icon: CalendarClock, tone: "text-brand-400" },
  ];

  const minutes = Math.round((stats?.totalSeconds ?? 0) / 60);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan pipeline produksi: job render, referensi yang sudah dianalisis, dan jadwal automation."
        action={
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
          >
            <Sparkles className="size-4" /> Generate video
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/45">{label}</span>
              <Icon className={`size-4 ${tone}`} />
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
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

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Timer className="size-3.5" /> Estimasi total durasi
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {minutes}
              <span className="ml-1 text-sm font-normal text-white/40">menit</span>
            </div>
            <p className="mt-1 text-[11px] text-white/35">Akumulasi dari semua video yang pernah dirender.</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-white/85">Referensi per platform</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {["youtube", "instagram", "tiktok", "web"].map((p) => {
                const count = stats?.byPlatform?.[p] ?? 0;
                const max = Math.max(1, ...Object.values(stats?.byPlatform ?? {}));
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="w-20 text-[11px] capitalize text-white/45">{p}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-[11px] tabular-nums text-white/50">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}