"use client";

import { Check, ChevronRight, Target } from "lucide-react";
import { Card } from "../../../components/ui";
import { CATEGORIES, type CategoryId, type GoalCategory } from "../_lib/goals-data";

export function CategoryPanel({
  categoryId,
  onChoose,
}: {
  categoryId: CategoryId | null;
  onChoose: (next: GoalCategory) => void;
}) {
  return (
    <Card className="p-5 xl:sticky xl:top-6">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-accent-400" />
        <h2 className="text-sm font-semibold text-white/85">Buat goal</h2>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-white/40">
        Pilih kategori. Asisten akan menanyakan hasil, target, dan deadline-nya.
      </p>

      <div className="mt-3 flex flex-col gap-0.5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = categoryId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChoose(c)}
              className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                active
                  ? "bg-white/8 text-white shadow-inner shadow-white/5"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                className={`size-[18px] shrink-0 transition ${
                  active ? "text-brand-400" : "text-white/45 group-hover:text-white/75"
                }`}
                strokeWidth={1.6}
              />
              <span className="flex-1 text-[13px] font-medium">{c.label}</span>
              {active ? (
                <Check className="size-3.5 shrink-0 text-lime-400" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0 text-white/25 opacity-0 transition group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/2 p-3">
        <p className="text-[10.5px] leading-relaxed text-white/40">
          <span className="text-white/60">Cara hitung:</span> video berstatus{" "}
          <span className="text-lime-300">siap</span> atau postingan berstatus{" "}
          <span className="text-lime-300">terkirim</span> sejak goal dibuat.
        </p>
      </div>
    </Card>
  );
}
