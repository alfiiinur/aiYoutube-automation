"use client";

import { useEffect, useRef, type FormEvent } from "react";
import type { GoalChat } from "../../../types";
import { parseDeadlineText, type GoalCategory } from "../_lib/goals-data";
import { useAutosaveChat } from "./use-autosave-chat";
import { useGoalChats } from "./use-goal-chats";
import { useGoalCreation } from "./use-goal-creation";
import { useGoalsData } from "./use-goals-data";
import { useGoalWizard } from "./use-goal-wizard";

export function useGoalsPage() {
  const goalsData = useGoalsData();
  const wizard = useGoalWizard();
  const goalChats = useGoalChats();
  useAutosaveChat(wizard, goalChats);
  const { createGoal } = useGoalCreation(goalsData, wizard, goalChats);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [wizard.step, wizard.categoryId, wizard.outcome, wizard.goalTarget, wizard.deadlineChoice, wizard.busy]);

  const chooseCategory = (next: GoalCategory) => {
    wizard.setCategoryId(next.id);
    wizard.setCustomStart(false);
    wizard.setOutcome(null);
    wizard.setGoalTarget(null);
    wizard.setDeadlineChoice(null);
    wizard.setStep("outcome");
    goalChats.setLiveChatId(null);
    wizard.setCreated(null);
    wizard.setError(null);
  };

  const startCustomGoal = (text: string) => {
    const title = text.trim();
    if (title.length < 3) {
      wizard.setError("Nama goal minimal 3 karakter.");
      return;
    }
    wizard.setCategoryId("lainnya");
    wizard.setCustomStart(true);
    wizard.setOutcome(title.slice(0, 120));
    wizard.setGoalTarget(null);
    wizard.setDeadlineChoice(null);
    wizard.setStep("target");
    goalChats.setLiveChatId(null);
    wizard.setCreated(null);
    wizard.setError(null);
    wizard.setDraft("");
  };

  const onSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = wizard.draft.trim();
    if (!text) return;
    wizard.setError(null);

    if (wizard.step === "category") {
      startCustomGoal(text);
      return;
    }

    if (wizard.step === "outcome") {
      wizard.setOutcome(text.slice(0, 120));
      wizard.setDraft("");
      wizard.setStep("target");
      return;
    }

    if (wizard.step === "target") {
      const numeric = Number.parseInt(text.replace(/[^\d]/g, ""), 10);
      if (!Number.isInteger(numeric) || numeric < 1) {
        wizard.setError("Masukkan angka target minimal 1.");
        return;
      }
      wizard.setGoalTarget(Math.min(100000, numeric));
      wizard.setDraft("");
      wizard.setStep("deadline");
      return;
    }

    if (wizard.step === "deadline") {
      const parsed = parseDeadlineText(text);
      if (!parsed) {
        wizard.setError("Pilih deadline di atas, atau ketik mis. “1 minggu”, “1 bulan”, atau “tanpa deadline”.");
        return;
      }
      wizard.setDeadlineChoice(parsed);
      wizard.setDraft("");
      wizard.setStep("confirm");
      return;
    }

    if (wizard.step === "confirm") {
      wizard.setError("Klik tombol “Buat goal” untuk menyimpan, atau “Atur ulang” untuk mulai lagi.");
      return;
    }

    // step === "done": teks baru langsung memulai goal berikutnya
    startCustomGoal(text);
  };

  const continueChat = (chat: GoalChat) => {
    wizard.applySnapshot(chat.snapshot);
    goalChats.setLiveChatId(chat.id);
    goalChats.setView({ kind: "live" });
  };

  const resetFlow = () => {
    wizard.resetWizard();
    goalChats.setLiveChatId(null);
  };

  const newChat = () => {
    resetFlow();
    goalChats.setView({ kind: "live" });
  };

  return {
    goals: goalsData.goals,
    loading: goalsData.loading,
    sorted: goalsData.sorted,
    activeCount: goalsData.activeCount,
    categoryId: wizard.categoryId,
    customStart: wizard.customStart,
    outcome: wizard.outcome,
    goalTarget: wizard.goalTarget,
    deadlineChoice: wizard.deadlineChoice,
    step: wizard.step,
    draft: wizard.draft,
    setDraft: wizard.setDraft,
    busy: wizard.busy,
    error: wizard.error,
    created: wizard.created,
    chats: goalChats.chats,
    chatsLoading: goalChats.chatsLoading,
    view: goalChats.view,
    setView: goalChats.setView,
    liveChatId: goalChats.liveChatId,
    chatScrollRef,
    category: wizard.category,
    activeChat: goalChats.activeChat,
    placeholder: wizard.placeholder,
    CategoryIcon: wizard.CategoryIcon,
    selectChat: goalChats.selectChat,
    continueChat,
    deleteChat: goalChats.deleteChat,
    newChat,
    resetFlow,
    chooseCategory,
    chooseOutcome: wizard.chooseOutcome,
    chooseTarget: wizard.chooseTarget,
    chooseDeadline: wizard.chooseDeadline,
    onSubmit,
    createGoal,
    toggleComplete: goalsData.toggleComplete,
    remove: goalsData.remove,
    updatePlan: goalsData.updatePlan,
  };
}

export type GoalsPageState = ReturnType<typeof useGoalsPage>;
