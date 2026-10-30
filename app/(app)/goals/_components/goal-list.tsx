"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";
import GoalPlanSection from "../../../components/GoalPlan";
import { Card, EmptyState, ProgressBar } from "../../../components/ui";
import type { GoalPlan, GoalWithProgress } from "../../../types";
import { METRICS, formatDay } from "../_lib/goals-data";

export function GoalList({
  loading,
  sorted,
  activeCount,
  totalCount,
  onToggleComplete,
  onRemove,
  onPlanUpdate,
}: {
  loading: boolean;
  sorted: GoalWithProgress[];
  activeCount: number;
  totalCount: number;
  onToggleComplete: (goal: GoalWithProgress) => void;
  onRemove: (id: string) => void;
  onPlanUpdate: (goalId: string, plan: GoalPlan) => void;
}) {
  return (
    <section id="goal-list" className="mt-8 scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">Goal kamu</h2>
          <p className="mt-0.5 text-[11.5px] text-white/40">
            Progres diperbarui otomatis setiap 5 detik.
          </p>
        </div>
        <span className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1 text-[10.5px] text-white/45">
          {activeCount} aktif · {totalCount} total
        </span>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/4" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Belum ada goal"
          hint="Mulai dari percakapan di atas: pilih kategori, tentukan hasil, lalu isi target dan deadline."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((g) => {
            const done = g.completedAt != null;
            const pct = Math.min(100, Math.round((g.progress / Math.max(1, g.target)) * 100));
            return (
              <Card key={g.id} className={`p-4 transition ${done ? "opacity-70" : "hover:border-white/14"}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleComplete(g)}
                    title={done ? "Buka kembali goal" : "Tandai selesai"}
                    aria-label={done ? "Buka kembali goal" : "Tandai selesai"}
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border transition ${
                      done
                        ? "border-lime-500/50 bg-lime-500/15 text-lime-300"
                        : "border-white/15 bg-white/3 text-transparent hover:border-lime-500/50 hover:text-lime-300/50"
                    }`}
                  >
                    <Check className="size-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-medium ${
                          done ? "text-white/50 line-through" : "text-white/90"
                        }`}
                      >
                        {g.title}
                      </h3>
                      {g.reached && !done && (
                        <span className="rounded-full bg-lime-500/12 px-2 py-0.5 text-[10px] font-medium text-lime-300">
                          Target tercapai
                        </span>
                      )}
                      {g.overdue && (
                        <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-medium text-brand-400">
                          Terlewat deadline
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {METRICS[g.metric]} · target {g.target} ·{" "}
                      {g.deadline ? formatDay(g.deadline) : "Tanpa deadline"}
                      {done && g.completedAt
                        ? ` · selesai ${new Date(g.completedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : ""}
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={pct} tone={g.reached || done ? "lime" : "brand"} />
                      </div>
                      <span className="text-[11px] tabular-nums text-white/60">
                        {g.progress}/{g.target}
                      </span>
                    </div>
                    <GoalPlanSection
                      goal={g}
                      onUpdate={(plan) => onPlanUpdate(g.id, plan)}
                    />
                  </div>
                  <span className="flex shrink-0 items-center">
                    {done && (
                      <button
                        onClick={() => onToggleComplete(g)}
                        title="Buka kembali"
                        aria-label="Buka kembali"
                        className="grid size-7 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(g.id)}
                      title="Hapus goal"
                      aria-label="Hapus goal"
                      className="grid size-7 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
