"use client";

import { useEffect, useState } from "react";
import type { GoalChat } from "../../../types";

export type GoalChatView = { kind: "live" } | { kind: "replay"; id: string };

export function useGoalChats() {
  const [chats, setChats] = useState<GoalChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [view, setView] = useState<GoalChatView>({ kind: "live" });
  const [liveChatId, setLiveChatId] = useState<string | null>(null);

  const loadChats = async () => {
    try {
      const r = await fetch("/api/goal-chats", { cache: "no-store" }).then((x) => x.json());
      setChats(r.chats ?? []);
    } catch {
      /* riwayat bersifat opsional */
    } finally {
      setChatsLoading(false);
    }
  };

  useEffect(() => {
    void loadChats();
  }, []);

  const activeChat = view.kind === "replay" ? (chats.find((c) => c.id === view.id) ?? null) : null;

  /* Kembali ke live bila chat yang dibuka sudah tidak ada. */
  useEffect(() => {
    if (view.kind === "replay" && !chats.some((c) => c.id === view.id)) {
      setView({ kind: "live" });
    }
  }, [view, chats]);

  const selectChat = (id: string) => {
    if (id === liveChatId) {
      setView({ kind: "live" });
      return;
    }
    setView({ kind: "replay", id });
  };

  const deleteChat = async (id: string) => {
    try {
      await fetch(`/api/goal-chats/${id}`, { method: "DELETE" });
    } catch {
      /* abaikan */
    }
    setChats((list) => list.filter((c) => c.id !== id));
    if (liveChatId === id) setLiveChatId(null);
    if (view.kind === "replay" && view.id === id) setView({ kind: "live" });
  };

  return {
    chats,
    setChats,
    chatsLoading,
    view,
    setView,
    liveChatId,
    setLiveChatId,
    activeChat,
    loadChats,
    selectChat,
    deleteChat,
  };
}

export type GoalChatsState = ReturnType<typeof useGoalChats>;
