"use client";

import type { GoalWithProgress } from "../../../types";
import type { GoalChatsState } from "./use-goal-chats";
import type { GoalWizardState } from "./use-goal-wizard";
import type { GoalsDataState } from "./use-goals-data";

export function useGoalCreation(
  goalsData: GoalsDataState,
  wizard: GoalWizardState,
  goalChats: GoalChatsState,
) {
  const createGoal = async () => {
    const { category, outcome, goalTarget, deadlineChoice } = wizard;
    if (!category || !outcome || goalTarget == null) return;
    wizard.setBusy(true);
    wizard.setError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: outcome.trim().slice(0, 120),
          metric: category.metric,
          target: goalTarget,
          deadline: deadlineChoice?.iso,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat goal");
      wizard.setCreated(data.goal as GoalWithProgress);
      if (goalChats.liveChatId) {
        const finished = data.goal as GoalWithProgress;
        try {
          await fetch(`/api/goal-chats/${goalChats.liveChatId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: finished.title,
              goalId: finished.id,
              snapshot: { ...wizard.snapshotOf(), step: "done" },
              transcript: [
                ...wizard.buildTranscript(),
                {
                  role: "assistant",
                  text: `Goal "${finished.title}" berhasil dibuat. Progres dihitung otomatis.`,
                  at: Date.now(),
                },
              ],
            }),
          });
          await goalChats.loadChats();
        } catch {
          /* riwayat opsional */
        }
      }
      wizard.setStep("done");
      wizard.setDraft("");
      await goalsData.load();
    } catch (e) {
      wizard.setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      wizard.setBusy(false);
    }
  };

  return { createGoal };
}

export type GoalCreationState = ReturnType<typeof useGoalCreation>;
