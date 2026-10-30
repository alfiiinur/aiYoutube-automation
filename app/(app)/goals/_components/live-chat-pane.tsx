"use client";

import type { FormEvent, RefObject } from "react";
import { Check, Loader2, Plus, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GoalWithProgress } from "../../../types";
import {
  CATEGORIES,
  DEADLINE_PRESETS,
  METRICS,
  deadlineText,
  formatDay,
  type DeadlineChoice,
  type GoalCategory,
  type Step,
} from "../_lib/goals-data";
import { AssistantBubble, OptionPicker, UserBubble } from "./chat-bubbles";

export function LiveChatPane({
  chatScrollRef,
  category,
  customStart,
  step,
  outcome,
  goalTarget,
  deadlineChoice,
  created,
  error,
  draft,
  setDraft,
  placeholder,
  CategoryIcon,
  busy,
  onSubmit,
  onReset,
  onChooseCategory,
  onChooseOutcome,
  onChooseTarget,
  onChooseDeadline,
  onCreateGoal,
}: {
  chatScrollRef: RefObject<HTMLDivElement | null>;
  category: GoalCategory | null;
  customStart: boolean;
  step: Step;
  outcome: string | null;
  goalTarget: number | null;
  deadlineChoice: DeadlineChoice | null;
  created: GoalWithProgress | null;
  error: string | null;
  draft: string;
  setDraft: (value: string) => void;
  placeholder: string;
  CategoryIcon: LucideIcon;
  busy: boolean;
  onSubmit: (event?: FormEvent) => void;
  onReset: () => void;
  onChooseCategory: (next: GoalCategory) => void;
  onChooseOutcome: (value: string) => void;
  onChooseTarget: (value: number) => void;
  onChooseDeadline: (id: string) => void;
  onCreateGoal: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AssistantBubble>
          Hai! Aku bantu susun goal yang progresnya dihitung otomatis dari job dan postingan.
          <span className="mt-1 block text-white/45">
            Mau mulai dari kategori apa? Pilih di panel “Buat goal”, atau langsung di sini.
          </span>
          {!category && (
            <OptionPicker
              options={CATEGORIES.map((c) => ({ label: c.label, value: c.id }))}
              onPick={(id) => onChooseCategory(CATEGORIES.find((c) => c.id === id) as GoalCategory)}
            />
          )}
        </AssistantBubble>

        {category && (
          <UserBubble>
            {customStart ? outcome : `Saya ingin memulai goal ${category.label.toLowerCase()}`}
          </UserBubble>
        )}

        {category && !customStart && (
          <AssistantBubble>
            {category.question}
            {step === "outcome" && (
              <OptionPicker
                options={category.outcomes.map((o) => ({ label: o, value: o }))}
                onPick={onChooseOutcome}
              />
            )}
          </AssistantBubble>
        )}

        {category && outcome && (
          <>
            {!customStart && <UserBubble>{outcome}</UserBubble>}
            <AssistantBubble>
              Berapa {category.unit} yang ingin kamu capai?
              {step === "target" && (
                <OptionPicker
                  options={category.targets.map((n) => ({
                    label: `${n} ${category.unit}`,
                    value: String(n),
                  }))}
                  onPick={(value) => onChooseTarget(Number(value))}
                />
              )}
            </AssistantBubble>
          </>
        )}

        {category && outcome && goalTarget != null && (
          <>
            <UserBubble>
              {goalTarget} {category.unit}
            </UserBubble>
            <AssistantBubble>
              Sampai kapan goal ini ingin kamu capai?
              {step === "deadline" && (
                <OptionPicker
                  options={DEADLINE_PRESETS.map((preset) => ({
                    label: preset.label,
                    value: preset.id,
                  }))}
                  onPick={onChooseDeadline}
                />
              )}
            </AssistantBubble>
          </>
        )}

        {category && outcome && goalTarget != null && deadlineChoice && (
          <UserBubble>{deadlineText(deadlineChoice)}</UserBubble>
        )}

        {step === "confirm" && category && outcome && goalTarget != null && (
          <AssistantBubble>
            Siap! Ini ringkasan goal kamu:
            <div className="mt-2.5 overflow-hidden rounded-xl border border-white/10 bg-ink-950/50">
              <div className="border-b border-white/6 px-3 py-2">
                <p className="text-[12.5px] font-medium leading-snug text-white/90">{outcome}</p>
                <p className="mt-0.5 text-[10.5px] text-white/35">
                  {category.label} · {METRICS[category.metric]}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-white/6">
                <div className="bg-ink-950/60 px-3 py-2">
                  <span className="text-[10px] text-white/35">Target</span>
                  <p className="mt-0.5 text-[12px] text-white/80">
                    {goalTarget} {category.unit}
                  </p>
                </div>
                <div className="bg-ink-950/60 px-3 py-2">
                  <span className="text-[10px] text-white/35">Deadline</span>
                  <p className="mt-0.5 text-[12px] text-white/80">
                    {deadlineChoice ? deadlineText(deadlineChoice) : "Tanpa deadline"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <button
                onClick={onCreateGoal}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12px] font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                {busy ? "Menyimpan…" : "Buat goal"}
              </button>
              <button
                onClick={onReset}
                disabled={busy}
                className="rounded-xl border border-white/12 px-3 py-2 text-[12px] text-white/55 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Atur ulang
              </button>
            </div>
          </AssistantBubble>
        )}

        {step === "done" && category && (
          <AssistantBubble>
            <p>
              <span className="font-medium text-lime-300">Goal berhasil dibuat.</span> Progres{" "}
              <span className="text-white/95">“{created?.title ?? outcome}”</span> dihitung otomatis dari{" "}
              {METRICS[category.metric].toLowerCase()} sejak goal dibuat.
            </p>
            {created && (
              <p className="mt-1 text-[11px] text-white/40">
                Target {created.target} {category.unit}
                {created.deadline ? ` · deadline ${formatDay(created.deadline)}` : " · tanpa deadline"}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12px] font-medium text-black transition hover:bg-white/85"
              >
                <Plus className="size-3.5" />
                Buat goal lain
              </button>
              <a
                href="#goal-list"
                className="rounded-xl border border-white/12 px-3 py-2 text-[12px] text-white/55 transition hover:bg-white/5 hover:text-white"
              >
                Lihat daftar
              </a>
            </div>
          </AssistantBubble>
        )}
      </div>

      <div className="border-t border-white/8 bg-ink-950/30 px-3 py-3">
        {error && <p className="mb-1.5 px-2 text-[11px] text-brand-400">{error}</p>}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-1.5 rounded-full border border-white/12 bg-ink-950/70 py-1.5 pl-1.5 pr-1.5 transition focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/10"
        >
          <button
            type="button"
            onClick={onReset}
            title="Mulai goal baru"
            aria-label="Mulai goal baru"
            className="grid size-8 shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
          >
            <Plus className="size-4" />
          </button>
          <span className="grid size-6 shrink-0 place-items-center text-white/30">
            <CategoryIcon className="size-3.5" />
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent py-1 text-[12.5px] text-white/85 outline-none placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            title="Kirim"
            aria-label="Kirim"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/85 disabled:opacity-30"
          >
            <Send className="size-3.5" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-white/25">
          Progres dihitung otomatis dari data job & postingan.
        </p>
      </div>
    </div>
  );
}
