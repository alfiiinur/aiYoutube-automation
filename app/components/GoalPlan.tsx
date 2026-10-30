"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clapperboard,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { GoalPlan, GoalWithProgress } from "@/app/types";

const COUNTS = [3, 6, 9, 12];

function dayLabel(scheduledAt?: string, dayOffset?: number): string {
  const date = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : null;
  return date ? `Hari ${dayOffset} · ${date}` : `Hari ${dayOffset}`;
}

export default function GoalPlanSection({
  goal,
  onUpdate,
}: {
  goal: GoalWithProgress;
  onUpdate: (plan: GoalPlan) => void;
}) {
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = goal.plan;
  const generated = plan?.items.filter((i) => i.status === "generated").length ?? 0;

  const build = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goal.id}/plan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal menyusun rencana");
      onUpdate(data.plan as GoalPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  };

  const rebuild = () => {
    if (generated > 0 && !window.confirm("Buat ulang rencana? Status generate yang sudah ada akan hilang.")) {
      return;
    }
    void build();
  };

  const generate = async (itemId: string, prompt: string) => {
    if (genId) return;
    setGenId(itemId);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat job");
      const jobId = String(data.job.id);

      const mark = await fetch(`/api/goals/${goal.id}/plan`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, jobId }),
      });
      const marked = await mark.json().catch(() => ({}));
      if (!mark.ok) throw new Error(marked.error ?? "Job dibuat, tapi gagal menandai rencana");
      onUpdate(marked.plan as GoalPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setGenId(null);
    }
  };

  /* ---------------- belum punya rencana ---------------- */
  if (!plan) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/2 p-3">
        <p className="text-[11px] leading-relaxed text-white/45">
          Ubah goal ini jadi kalender ide video — tiap item bisa langsung di-generate.
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={busy}
            aria-label="Jumlah ide"
            className="rounded-lg border border-white/12 bg-ink-950/70 px-2 py-2 text-[11px] text-white/75 outline-none transition focus:border-white/30 disabled:opacity-50"
          >
            {COUNTS.map((n) => (
              <option key={n} value={n}>
                {n} ide
              </option>
            ))}
          </select>
          <button
            onClick={() => void build()}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {busy ? "Menyusun…" : "Buatkan rencana"}
          </button>
        </div>
        {error && <p className="mt-2 text-[11px] text-white">{error}</p>}
      </div>
    );
  }

  /* ---------------- sudah punya rencana ---------------- */
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            plan.source === "ai" ? "bg-white text-black" : "border border-white/20 text-white/60"
          }`}
        >
          {plan.source === "ai" ? "Rencana AI" : "Rencana lokal"}
        </span>
        <span className="text-[10.5px] tabular-nums text-white/40">
          {generated}/{plan.items.length} di-generate
        </span>
        <button
          onClick={rebuild}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10.5px] text-white/40 transition hover:bg-white/8 hover:text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          Buat ulang
        </button>
      </div>
      {plan.notice && <p className="mt-1.5 text-[10.5px] leading-relaxed text-white/35">{plan.notice}</p>}
      {error && <p className="mt-1.5 text-[11px] text-white">{error}</p>}

      <div className="mt-2 flex flex-col gap-1.5">
        {plan.items.map((item) => {
          const isOpen = expanded === item.id;
          const isGen = item.status === "generated";
          const working = genId === item.id;
          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-lg border transition ${
                isGen ? "border-white/8 bg-white/2" : "border-white/10 bg-ink-950/50"
              }`}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <button
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={`size-3.5 shrink-0 text-white/35 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
                  <span className="min-w-0">
                    <span className={`block truncate text-[11.5px] font-medium ${isGen ? "text-white/50" : "text-white/85"}`}>
                      {item.title}
                    </span>
                    <span className="block text-[10px] text-white/35">
                      {dayLabel(item.scheduledAt, item.dayOffset)}
                      {item.angle ? ` · ${item.angle}` : ""}
                    </span>
                  </span>
                </button>
                {isGen ? (
                  item.jobId ? (
                    <Link
                      href={`/jobs/${item.jobId}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/12 px-2 py-1.5 text-[10.5px] text-white/65 transition hover:bg-white/8 hover:text-white"
                    >
                      <Check className="size-3" /> Lihat job <ArrowUpRight className="size-3" />
                    </Link>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/8 px-2 py-1.5 text-[10.5px] text-white/50">
                      <Check className="size-3" /> Dibuat
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => void generate(item.id, item.prompt)}
                    disabled={genId != null}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[10.5px] font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
                  >
                    {working ? <Loader2 className="size-3 animate-spin" /> : <Clapperboard className="size-3" />}
                    {working ? "Membuat…" : "Generate"}
                  </button>
                )}
              </div>
              {isOpen && (
                <p className="border-t border-white/6 px-3 py-2 text-[11px] leading-relaxed text-white/55">
                  {item.prompt}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
