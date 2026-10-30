"use client";

import { useEffect } from "react";
import type { GoalChat } from "../../../types";
import type { GoalChatsState } from "./use-goal-chats";
import type { GoalWizardState } from "./use-goal-wizard";

/* Simpan otomatis percakapan berjalan (debounce 800ms). */
export function useAutosaveChat(wizard: GoalWizardState, chats: GoalChatsState) {
  useEffect(() => {
    if (chats.view.kind !== "live" || !wizard.category) return;
    const transcript = wizard.buildTranscript();
    const snapshot = wizard.snapshotOf();
    const title = wizard.liveTitle();
    const chatId = chats.liveChatId;
    const t = setTimeout(async () => {
      try {
        if (chatId) {
          const res = await fetch(`/api/goal-chats/${chatId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, snapshot, transcript }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.chat) {
            const updated = data.chat as GoalChat;
            chats.setChats((list) => [updated, ...list.filter((c) => c.id !== updated.id)]);
          } else if (res.status === 404) {
            chats.setLiveChatId(null);
          }
        } else {
          const res = await fetch("/api/goal-chats", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, snapshot, transcript }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.chat) {
            const fresh = data.chat as GoalChat;
            chats.setLiveChatId(fresh.id);
            chats.setChats((list) => [fresh, ...list.filter((c) => c.id !== fresh.id)]);
          }
        }
      } catch {
        /* riwayat opsional — jangan ganggu builder */
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chats.view,
    wizard.step,
    wizard.categoryId,
    wizard.outcome,
    wizard.goalTarget,
    wizard.deadlineChoice,
    chats.liveChatId,
    wizard.created,
  ]);
}
