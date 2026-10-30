"use client";

import { Check, History, Plus, Trash2 } from "lucide-react";
import type { GoalChat } from "../../../types";
import { chatDate } from "../_lib/goals-data";

export function HistoryList({
  chats,
  loading,
  activeId,
  liveId,
  onSelect,
  onNew,
  onDelete,
}: {
  chats: GoalChat[];
  loading: boolean;
  activeId: string | null;
  liveId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
          <History className="size-3.5" /> Riwayat
        </span>
        <span className="text-[10px] tabular-nums text-white/30">{chats.length}</span>
      </div>
      <div className="px-2 pb-2">
        <button
          onClick={onNew}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" /> Baru
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/4" />)
        ) : chats.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[10.5px] leading-relaxed text-white/35">
            Belum ada riwayat. Mulai percakapan dan otomatis tersimpan di sini.
          </p>
        ) : (
          chats.map((c) => {
            const active = c.id === activeId;
            const live = c.id === liveId;
            return (
              <div
                key={c.id}
                className={`group relative rounded-xl border transition ${
                  active ? "border-white/20 bg-white/8" : "border-transparent hover:bg-white/5"
                }`}
              >
                <button onClick={() => onSelect(c.id)} className="block w-full px-2.5 py-2 text-left">
                  <span className="flex items-center gap-1.5">
                    {live && <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-white" />}
                    <span className="truncate text-[11.5px] font-medium text-white/80">{c.title}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/30">
                    {chatDate(c.updatedAt)}
                    {c.goalId && (
                      <span className="inline-flex items-center gap-0.5 text-white/50">
                        <Check className="size-2.5" /> goal
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  title="Hapus chat"
                  aria-label="Hapus chat"
                  className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-lg text-white/25 opacity-0 transition hover:bg-white/8 hover:text-white group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
