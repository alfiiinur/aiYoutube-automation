"use client";

import { Timer } from "lucide-react";
import { Card } from "../../../components/ui";
import type { Stats } from "../_hooks/useDashboardData";

export function SideCards({ stats }: { stats: Stats | null }) {
  const minutes = Math.round((stats?.totalSeconds ?? 0) / 60);

  return (
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
                    className="h-full rounded-full bg-white"
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
  );
}
