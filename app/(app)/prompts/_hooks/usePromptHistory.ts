"use client";

import { useCallback, useEffect, useState } from "react";
import type { PromptHistoryEntry } from "../../../types";
import type { GeneratedSet } from "./usePromptIdeas";

/** Riwayat generate ide: tersimpan di database (20 terbaru). */
export function usePromptHistory() {
  const [entries, setEntries] = useState<PromptHistoryEntry[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/prompt-history", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { entries?: PromptHistoryEntry[] };
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      /* riwayat opsional — jangan blokir halaman kalau gagal dimuat */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const push = useCallback(async (set: GeneratedSet) => {
    try {
      const res = await fetch("/api/prompt-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(set),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { entry?: PromptHistoryEntry };
      if (!data.entry) return;
      setEntries((prev) => [data.entry as PromptHistoryEntry, ...prev].slice(0, 20));
      setLoadedId(data.entry.id);
    } catch {
      /* abaikan — hasil generate tetap tampil walau riwayat gagal disimpan */
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setLoadedId((cur) => (cur === id ? null : cur));
    try {
      await fetch(`/api/prompt-history/${id}`, { method: "DELETE" });
    } catch {
      /* abaikan */
    }
  }, []);

  return { entries, loadedId, setLoadedId, push, remove };
}
