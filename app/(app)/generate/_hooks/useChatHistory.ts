"use client";

import { useMemo, useState } from "react";
import type { VideoJob } from "../../../types";

/** Sidebar chats: riwayat job dari DB + pencarian. */
export function useChatHistory() {
  const [chats, setChats] = useState<VideoJob[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatQuery, setChatQuery] = useState("");
  const [loadedJobId, setLoadedJobId] = useState<string | null>(null);

  const loadChats = async () => {
    try {
      const r = await fetch("/api/jobs", { cache: "no-store" }).then((x) => x.json());
      setChats(r.jobs ?? []);
    } catch {
      /* riwayat bersifat opsional — jangan blokir halaman kalau gagal dimuat */
    } finally {
      setChatsLoading(false);
    }
  };

  const filteredChats = useMemo(() => {
    const q = chatQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) => c.prompt.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
    );
  }, [chats, chatQuery]);

  const deleteChat = async (chatId: string) => {
    await fetch(`/api/jobs/${chatId}`, { method: "DELETE" });
    setChats((list) => list.filter((c) => c.id !== chatId));
    setLoadedJobId((cur) => (cur === chatId ? null : cur));
  };

  return {
    chats, chatsLoading, loadChats,
    chatQuery, setChatQuery, filteredChats,
    loadedJobId, setLoadedJobId, deleteChat,
  };
}

export type ChatHistory = ReturnType<typeof useChatHistory>;
