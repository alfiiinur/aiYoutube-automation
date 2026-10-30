"use client";

import { History, Plus, Trash2 } from "lucide-react";
import { Card } from "../../../components/ui";
import type { PromptSkill } from "../../../types";
import { skillDate } from "../_lib/format";
import type { SkillGroup } from "../_hooks/useGeneratePage";

type Props = {
  skillsLoading: boolean;
  skillsCount: number;
  groups: SkillGroup[];
  nextPartFor: (seriesName: string) => number;
  onContinueSeries: (name: string) => void;
  onApplySkill: (skill: PromptSkill) => void;
  onDeleteSkill: (id: string) => void;
};

export function SkillListCard({
  skillsLoading,
  skillsCount,
  groups,
  nextPartFor,
  onContinueSeries,
  onApplySkill,
  onDeleteSkill,
}: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-white/85">Skill prompt</h2>
        </div>
        <span className="text-[11px] tabular-nums text-white/35">
          {skillsCount} tersimpan
        </span>
      </div>
      <p className="mt-1 text-[11px] text-white/40">
        Riwayat prompt yang disimpan. Kelompokkan prompt bersambung dalam satu serial, lalu
        lanjutkan part berikutnya kapan saja.
      </p>

      {skillsLoading ? (
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/4" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/35">
          Belum ada skill tersimpan. Setiap generate akan ditawari untuk menyimpan prompt.
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.name ?? "__loose"} className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-white/70">
                {g.name ?? "Tanpa serial"}
                <span className="ml-1.5 font-normal tabular-nums text-white/30">
                  {g.parts.length} prompt
                </span>
              </h3>
              {g.name && (
                <button
                  onClick={() => onContinueSeries(g.name as string)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-accent-500/30 bg-accent-500/10 px-2 py-1 text-[10.5px] text-accent-400 transition hover:bg-accent-500/20"
                >
                  <Plus className="size-3" /> Lanjut part {nextPartFor(g.name)}
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {g.parts.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-white/8 bg-white/2 p-3 transition hover:border-white/16"
                >
                  <div className="flex items-start gap-2">
                    {s.part != null && (
                      <span className="mt-0.5 shrink-0 rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-brand-400">
                        Part {s.part}
                      </span>
                    )}
                    <p className="line-clamp-2 min-w-0 flex-1 text-[11.5px] leading-relaxed text-white/70">
                      {s.prompt}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] text-white/30">
                      {s.aspectRatio} · {s.durationSec}s · {s.style} · {skillDate(s.createdAt)}
                      {s.useCount > 0 ? ` · dipakai ${s.useCount}×` : ""}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => onApplySkill(s)}
                        className="rounded-lg px-2 py-1 text-[10.5px] text-accent-400 transition hover:bg-white/8"
                      >
                        Pakai
                      </button>
                      <button
                        onClick={() => onDeleteSkill(s.id)}
                        className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                        aria-label="Hapus skill"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
