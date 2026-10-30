"use client";

import { ArrowLeft, Check, RotateCcw, Trash2 } from "lucide-react";
import type { GoalChat } from "../../../types";
import { chatDate } from "../_lib/goals-data";
import { AssistantBubble, UserBubble } from "./chat-bubbles";

export function ReplayPane({
  chat,
  goalTitle,
  onBack,
  onContinue,
  onDelete,
}: {
  chat: GoalChat;
  goalTitle: string | null;
  onBack: () => void;
  onContinue: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
        <button
          onClick={onBack}
          title="Kembali ke percakapan"
          aria-label="Kembali ke percakapan"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/8 hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-white/85">{chat.title}</p>
          <p className="text-[10px] text-white/35">
            {chatDate(chat.updatedAt)} · {chat.transcript.length} pesan
            {chat.goalId ? " · goal dibuat" : ""}
          </p>
        </div>
        {!chat.goalId && (
          <button
            onClick={onContinue}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-medium text-black transition hover:bg-white/85"
          >
            <RotateCcw className="size-3" /> Lanjutkan
          </button>
        )}
        <button
          onClick={onDelete}
          title="Hapus chat"
          aria-label="Hapus chat"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {chat.transcript.length === 0 ? (
          <p className="py-8 text-center text-[11px] text-white/35">Percakapan ini kosong.</p>
        ) : (
          chat.transcript.map((m, i) =>
            m.role === "user" ? (
              <UserBubble key={i}>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </UserBubble>
            ) : (
              <AssistantBubble key={i}>
                <span className="whitespace-pre-wrap">{m.text}</span>
              </AssistantBubble>
            ),
          )
        )}
      </div>
      {chat.goalId && (
        <div className="border-t border-white/8 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-white/45">
            <Check className="size-3.5 text-white" /> Goal{goalTitle ? ` "${goalTitle}"` : ""} dibuat dari
            percakapan ini.
          </p>
        </div>
      )}
    </div>
  );
}
