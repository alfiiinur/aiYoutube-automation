"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { Card, PageHeader, EmptyState } from "../components/ui";
import type { SocialPost } from "../types";

const PLATFORM_LABEL: Record<SocialPost["platform"], string> = {
  threads: "Threads",
  instagram: "Instagram",
  facebook: "Facebook",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()).toISOString());
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()).toISOString());

  useEffect(() => {
    fetch("/api/posts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
    const t = setInterval(() => {
      fetch("/api/posts", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setPosts(d.posts ?? []));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const days = useMemo(() => {
    const base = new Date(anchor);
    const count = view === "week" ? 7 : 30;
    return Array.from({ length: count }, (_, i) => startOfDay(addDays(base, i)));
  }, [anchor, view]);

  const monthLabel = useMemo(() => {
    const base = new Date(anchor);
    return base.toLocaleString("id-ID", { month: "long", year: "numeric" });
  }, [anchor]);

  const selected = new Date(selectedDay);
  const selectedPosts = posts.filter((p) => {
    const d = new Date(p.scheduledAt);
    return d.toDateString() === selected.toDateString();
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const go = (n: number) => {
    const base = new Date(anchor);
    base.setDate(base.getDate() + (view === "week" ? n * 7 : n * 30));
    setAnchor(startOfDay(base).toISOString());
  };

  const statusStyle: Record<SocialPost["status"], string> = {
    scheduled: "bg-sky-500/15 text-sky-300",
    sent: "bg-lime-500/15 text-lime-300",
    failed: "bg-brand-500/15 text-brand-400",
  };

  return (
    <div>
      <PageHeader
        title="Kalender Konten"
        subtitle="Lihat semua konten terjadwal per hari dan pastikan ritme posting di Threads, Instagram, dan Facebook tetap konsisten."
        action={
          <Link
            href="/publish"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            <Plus className="size-4" /> Buat postingan
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => go(-1)}
              className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white/90"
              aria-label="Mundur"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-white/90">{monthLabel}</div>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-white/35">
                <CalendarDays className="size-3" />
                {view === "week" ? "Tampilan mingguan" : "30 hari"}
              </div>
            </div>
            <button
              onClick={() => go(1)}
              className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white/90"
              aria-label="Maju"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex justify-end">
            <div className="inline-flex rounded-lg border border-white/8 bg-white/3 p-0.5">
              {["week", "month"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as "week" | "month")}
                  className={`rounded-md px-2.5 py-1 text-[10px] transition ${
                    view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {v === "week" ? "Minggu" : "Bulan"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            {days.map((d) => {
              const dayPosts = posts.filter((p) => new Date(p.scheduledAt).toDateString() === d.toDateString());
              const isSelected = d.toISOString() === selectedDay;
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDay(d.toISOString())}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                    isSelected ? "border-brand-500/40 bg-brand-500/8" : "border-white/8 bg-white/2 hover:bg-white/5"
                  }`}
                >
                  <div>
                    <div className="text-[12px] font-medium text-white/85">
                      {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                    <div className="mt-0.5 text-[10px] text-white/35">{dayPosts.length} konten</div>
                  </div>
                  {dayPosts.length > 0 && <span className="size-1.5 rounded-full bg-accent-400" />}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-white/85">
              {selected.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/35">{selectedPosts.length} konten terjadwal</p>
          </div>

          {selectedPosts.length === 0 ? (
            <EmptyState
              title="Tidak ada konten di hari ini"
              hint="Pilih tanggal lain atau buat postingan baru dari Auto Post."
            />
          ) : (
            selectedPosts.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white/90">{p.jobTitle}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusStyle[p.status]}`}>
                        {PLATFORM_LABEL[p.platform]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{p.caption}</p>
                    <p className="mt-1 text-[10px] text-white/30">
                      {new Date(p.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </p>
                  </div>
                  {p.status === "sent" && p.postUrl && (
                    <a
                      href={p.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg px-2 py-1 text-[10px] text-lime-400 transition hover:bg-lime-400/10"
                    >
                      Lihat
                    </a>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}