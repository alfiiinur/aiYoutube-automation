"use client";

import { Film, Link2, CalendarClock, Sparkles } from "lucide-react";
import { Card } from "../../../components/ui";
import type { Stats } from "../_hooks/useDashboardData";

export function StatTiles({ stats }: { stats: Stats | null }) {
  const tiles = [
    { label: "Total job", value: stats?.totalJobs ?? 0, icon: Film, tone: "text-sky-300" },
    { label: "Video siap", value: stats?.ready ?? 0, icon: Sparkles, tone: "text-lime-300" },
    { label: "Referensi", value: stats?.references ?? 0, icon: Link2, tone: "text-accent-400" },
    { label: "Automation aktif", value: stats?.activeAutomations ?? 0, icon: CalendarClock, tone: "text-brand-400" },
  ];

  return (
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
  );
}
