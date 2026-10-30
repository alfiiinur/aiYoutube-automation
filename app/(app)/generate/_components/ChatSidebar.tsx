"use client";

import Link from "next/link";
import { ArrowUpRight, Plus, Search, Trash2 } from "lucide-react";
import type { VideoJob } from "../../../types";
import { chatDot, skillDate } from "../_lib/format";

type Props = {
  open: boolean;
  chats: VideoJob[];
  chatsLoading: boolean;
  filteredChats: VideoJob[];
  chatQuery: string;
  setChatQuery: (v: string) => void;
  loadedJobId: string | null;
  onNewChat: () => void;
  onLoadChat: (chat: VideoJob) => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
};

export function ChatSidebar({
  open,
  chats,
  chatsLoading,
  filteredChats,
  chatQuery,
  setChatQuery,
  loadedJobId,
  onNewChat,
  onLoadChat,
  onDeleteChat,
  onClose,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`${open ? "flex" : "hidden"} fixed bottom-0 left-0 top-14 z-40 w-72 shrink-0 flex-col gap-2 overflow-y-auto border-r border-white/8 bg-ink-950 p-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:w-60 xl:rounded-2xl xl:border xl:bg-white/2`}
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-semibold text-white/85">Chats</h2>
          <span className="text-[11px] tabular-nums text-white/35">{chats.length}</span>
        </div>
        <button
          onClick={onNewChat}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" /> Chat baru
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Cari riwayat…"
            className="w-full rounded-xl border border-white/8 bg-ink-950/70 py-2 pl-8 pr-2.5 text-[11.5px] text-white/85 outline-none transition placeholder:text-white/25 focus:border-brand-500/50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {chatsLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/4" />
            ))
          ) : filteredChats.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[11px] text-white/35">
              {chats.length === 0 ? "Belum ada riwayat generate." : "Tidak ada chat yang cocok."}
            </p>
          ) : (
            filteredChats.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border p-2.5 transition ${
                  loadedJobId === c.id
                    ? "border-brand-500/40 bg-brand-500/8"
                    : "border-white/8 bg-white/2 hover:border-white/16"
                }`}
              >
                <button onClick={() => onLoadChat(c)} className="block w-full text-left">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-1.5 shrink-0 rounded-full ${chatDot(c.status)}`} />
                    <span className="truncate text-[9px] uppercase tracking-wide text-white/30">
                      {c.status} · {skillDate(c.createdAt)}
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[11.5px] leading-snug text-white/75">
                    {c.prompt}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-white/30">
                    {c.aspectRatio} · {c.durationSec}s · {c.style}
                  </span>
                </button>
                <span className="mt-1.5 flex items-center justify-end gap-1 border-t border-white/6 pt-1.5">
                  <Link
                    href={`/jobs/${c.id}`}
                    className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[10px] text-white/40 transition hover:bg-white/8 hover:text-white"
                  >
                    Buka job <ArrowUpRight className="size-3" />
                  </Link>
                  <button
                    onClick={() => onDeleteChat(c.id)}
                    className="grid size-6 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                    aria-label="Hapus chat"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
