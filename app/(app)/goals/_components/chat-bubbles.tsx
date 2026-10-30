"use client";

import { ChevronRight, Sparkles } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

export function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/10">
        <Sparkles className="size-3.5 text-accent-400" />
      </span>
      <div className="min-w-0 max-w-[86%] rounded-2xl rounded-tl-md border border-white/8 bg-white/4 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/80">
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[84%] rounded-2xl rounded-tr-md bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-black">
        {children}
      </div>
    </div>
  );
}

export function OptionPicker({
  options,
  onPick,
  disabled = false,
}: {
  options: { label: string; value: string }[];
  onPick: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onPick(option.value)}
          className="group flex w-full items-center gap-2 rounded-xl border border-dashed border-white/18 bg-white/2 px-3 py-2 text-left text-[12px] leading-snug text-white/75 transition hover:border-accent-400/60 hover:bg-accent-500/10 hover:text-white disabled:opacity-50"
        >
          <span className="flex-1">{option.label}</span>
          <ChevronRight className="size-3.5 shrink-0 text-accent-400 opacity-0 transition group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}
