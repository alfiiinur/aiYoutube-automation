"use client";

import type { KeyboardEvent, RefObject } from "react";
import { History, X } from "lucide-react";
import { Card } from "../../../components/ui";
import type { PromptSkill } from "../../../types";
import { IDEAS } from "../_lib/constants";
import type { PendingSeries } from "../_hooks/useGeneratePage";

type Props = {
  prompt: string;
  setPrompt: (v: string) => void;
  promptRef: RefObject<HTMLTextAreaElement | null>;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  slashMode: boolean;
  slashResults: PromptSkill[];
  highlight: number;
  setHighlight: (v: number | ((h: number) => number)) => void;
  onApplySkill: (skill: PromptSkill) => void;
  skillsCount: number;
  pendingSeries: PendingSeries | null;
  onClearPendingSeries: () => void;
};

export function PromptCard({
  prompt,
  setPrompt,
  promptRef,
  onKeyDown,
  slashMode,
  slashResults,
  highlight,
  setHighlight,
  onApplySkill,
  skillsCount,
  pendingSeries,
  onClearPendingSeries,
}: Props) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-white/60">Prompt / ide video</label>
        <span className="text-[10px] text-white/30">
          Ketik{" "}
          <kbd className="rounded border border-white/12 bg-white/5 px-1 font-sans text-white/50">
            /
          </kbd>{" "}
          untuk cari riwayat
        </span>
      </div>
      {pendingSeries && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 text-[11px] text-accent-400">
          <span className="truncate">
            Melanjutkan serial “{pendingSeries.series}” · Part {pendingSeries.part}
          </span>
          <button
            onClick={onClearPendingSeries}
            className="grid size-5 shrink-0 place-items-center rounded-md transition hover:bg-white/10"
            aria-label="Batalkan lanjutan serial"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="relative">
        <textarea
          ref={promptRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          rows={5}
          placeholder="Contoh: video pendek tentang cara memilih mikrofon untuk podcaster pemula, gaya cinematic, bahasa Indonesia santai..."
          className="input-base resize-y"
        />
        {slashMode && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-white/10 bg-ink-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur">
            {slashResults.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px] text-white/35">
                {skillsCount === 0
                  ? "Belum ada skill tersimpan."
                  : "Tidak ada skill yang cocok. Tekan Esc untuk menulis prompt baru."}
              </p>
            ) : (
              slashResults.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => onApplySkill(s)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                    i === Math.min(highlight, slashResults.length - 1)
                      ? "bg-white/8"
                      : "hover:bg-white/4"
                  }`}
                >
                  <History className="mt-0.5 size-3.5 shrink-0 text-accent-400" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[11.5px] leading-snug text-white/80">
                      {s.prompt}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/35">
                      {s.series ? `${s.series}${s.part ? ` · Part ${s.part}` : ""} · ` : ""}
                      {s.aspectRatio} · {s.durationSec}s · {s.style}
                      {s.useCount > 0 ? ` · dipakai ${s.useCount}×` : ""}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            onClick={() => setPrompt(idea)}
            className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1 text-[11px] text-white/50 transition hover:border-white/16 hover:text-white/80"
          >
            {idea.slice(0, 42)}…
          </button>
        ))}
      </div>
    </Card>
  );
}
