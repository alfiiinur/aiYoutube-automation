"use client";

import { MessageSquarePlus, Trash2, X } from "lucide-react";
import { skillDate } from "../../generate/_lib/format";
import type { PromptHistoryEntry } from "../../../types";

export function HistorySidebar({
  open,
  entries,
  loadedId,
  onNew,
  onLoad,
  onDelete,
  onClose,
}: {
  open: boolean;
  entries: PromptHistoryEntry[];
  loadedId: string | null;
  onNew: () => void;
  onLoad: (entry: PromptHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <aside className="flex max-h-[calc(100vh-140px)] w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-900/70">
      <div className="flex items-center justify-between gap-2 border-b border-white/6 px-3 py-2.5">
        <p className="text-[12px] font-semibold text-white/85">Riwayat</p>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] text-white/50 transition hover:bg-white/8 hover:text-white"
            title="Chat baru"
          >
            <MessageSquarePlus className="size-3.5" /> Baru
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Tutup riwayat"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {entries.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[11px] leading-relaxed text-white/35">
            Belum ada riwayat. Setiap generate otomatis tersimpan di sini.
          </p>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            className={`group flex items-start gap-1 rounded-xl px-2 py-2 transition ${
              loadedId === e.id ? "bg-white/8" : "hover:bg-white/4"
            }`}
          >
            <button onClick={() => onLoad(e)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-[12px] text-white/80">{e.topic}</p>
              <p className="mt-0.5 text-[10px] tabular-nums text-white/35">
                {e.ideas.length} ide · {e.source === "ai" ? "AI" : "lokal"} · {skillDate(e.at)}
              </p>
            </button>
            <button
              onClick={() => onDelete(e.id)}
              className="rounded-md p-1 text-white/25 opacity-0 transition hover:bg-white/8 hover:text-brand-400 group-hover:opacity-100"
              aria-label="Hapus riwayat"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
