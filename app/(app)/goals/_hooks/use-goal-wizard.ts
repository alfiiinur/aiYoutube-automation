"use client";

import { useMemo, useState } from "react";
import { Target } from "lucide-react";
import type {
  GoalChatMessage,
  GoalChatSnapshot,
  GoalWithProgress,
} from "../../../types";
import {
  CATEGORIES,
  deadlineForPreset,
  deadlineText,
  type CategoryId,
  type DeadlineChoice,
  type Step,
} from "../_lib/goals-data";

export function useGoalWizard() {
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [customStart, setCustomStart] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [deadlineChoice, setDeadlineChoice] = useState<DeadlineChoice | null>(null);
  const [step, setStep] = useState<Step>("category");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<GoalWithProgress | null>(null);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId) ?? null,
    [categoryId],
  );

  const buildTranscript = (): GoalChatMessage[] => {
    const at = Date.now();
    const msgs: GoalChatMessage[] = [];
    const say = (role: GoalChatMessage["role"], text: string) => {
      msgs.push({ role, text, at });
    };
    say(
      "assistant",
      "Hai! Aku bantu susun goal yang progresnya dihitung otomatis dari job dan postingan. Mau mulai dari kategori apa?",
    );
    if (!category) return msgs;
    say("user", customStart && outcome ? outcome : `Saya ingin memulai goal ${category.label.toLowerCase()}`);
    if (!customStart) say("assistant", category.question);
    if (!outcome) return msgs;
    if (!customStart) say("user", outcome);
    say("assistant", `Berapa ${category.unit} yang ingin kamu capai?`);
    if (goalTarget == null) return msgs;
    say("user", `${goalTarget} ${category.unit}`);
    say("assistant", "Sampai kapan goal ini ingin kamu capai?");
    if (!deadlineChoice) return msgs;
    say("user", deadlineText(deadlineChoice));
    say(
      "assistant",
      `Ringkasan goal: "${outcome}" — target ${goalTarget} ${category.unit}, deadline ${deadlineText(deadlineChoice)}.`,
    );
    if (step === "done") {
      say("assistant", `Goal "${created?.title ?? outcome}" berhasil dibuat. Progres dihitung otomatis.`);
    }
    return msgs;
  };

  const snapshotOf = (): GoalChatSnapshot => ({
    categoryId,
    customStart,
    outcome,
    goalTarget,
    deadlineChoice,
    step,
  });

  const liveTitle = (): string =>
    (outcome ?? (category ? `Goal ${category.label}` : "Percakapan baru")).slice(0, 120);

  const chooseOutcome = (value: string) => {
    setOutcome(value);
    setStep("target");
    setError(null);
  };

  const chooseTarget = (value: number) => {
    setGoalTarget(value);
    setStep("deadline");
    setError(null);
  };

  const chooseDeadline = (id: string) => {
    setDeadlineChoice(deadlineForPreset(id));
    setStep("confirm");
    setError(null);
  };

  const resetWizard = () => {
    setCategoryId(null);
    setCustomStart(false);
    setOutcome(null);
    setGoalTarget(null);
    setDeadlineChoice(null);
    setStep("category");
    setDraft("");
    setError(null);
    setCreated(null);
  };

  const applySnapshot = (s: GoalChatSnapshot) => {
    const cat = CATEGORIES.find((c) => c.id === s.categoryId) ?? null;
    setCategoryId(cat ? cat.id : null);
    setCustomStart(s.customStart);
    setOutcome(s.outcome);
    setGoalTarget(s.goalTarget);
    setDeadlineChoice(s.deadlineChoice);
    setStep((["category", "outcome", "target", "deadline", "confirm", "done"] as Step[]).includes(s.step as Step) ? (s.step as Step) : "category");
    setDraft("");
    setError(null);
    setCreated(null);
  };

  const placeholder =
    step === "category"
      ? "Atau tulis goal sendiri…"
      : step === "outcome"
        ? "Atau tulis hasil yang kamu mau…"
        : step === "target"
          ? "Atau tulis angka target…"
          : step === "deadline"
            ? "Ketik “tanpa deadline” atau pilih di atas…"
            : step === "confirm"
              ? "Klik “Buat goal” untuk menyimpan…"
              : "Mulai goal baru dengan mengetik…";

  const CategoryIcon = category?.icon ?? Target;

  return {
    categoryId,
    setCategoryId,
    customStart,
    setCustomStart,
    outcome,
    setOutcome,
    goalTarget,
    setGoalTarget,
    deadlineChoice,
    setDeadlineChoice,
    step,
    setStep,
    draft,
    setDraft,
    busy,
    setBusy,
    error,
    setError,
    created,
    setCreated,
    category,
    placeholder,
    CategoryIcon,
    buildTranscript,
    snapshotOf,
    liveTitle,
    chooseOutcome,
    chooseTarget,
    chooseDeadline,
    resetWizard,
    applySnapshot,
  };
}

export type GoalWizardState = ReturnType<typeof useGoalWizard>;
