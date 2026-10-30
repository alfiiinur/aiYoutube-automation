"use client";

import Link from "next/link";
import { ArrowUpRight, Target } from "lucide-react";
import type { GoalWithProgress } from "../../../types";

export function GoalsStrip({ goals }: { goals: GoalWithProgress[] }) {
  if (goals.length === 0) return null;
  return (
    <Link
      href="/goals"
      className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/8 bg-white/2 px-4 py-3 transition hover:border-white/16"
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-white/80">
        <Target className="size-3.5 text-accent-400" /> Goals aktif
      </span>
      {goals.slice(0, 3).map((goal) => (
        <span key={goal.id} className="flex min-w-40 flex-1 items-center gap-2 text-[11px] text-white/50">
          <span className="max-w-32 truncate">{goal.title}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
            <span
              className={`block h-full rounded-full "bg-white"`}
              style={{ width: `${Math.min(100, (goal.progress / Math.max(1, goal.target)) * 100)}%` }}
            />
          </span>
          <span className="tabular-nums">
            {goal.progress}/{goal.target}
          </span>
        </span>
      ))}
      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-white/40">
        Lihat semua <ArrowUpRight className="size-3" />
      </span>
    </Link>
  );
}
