"use client";

import { StickyNote } from "lucide-react";
import type { SocialPost } from "../../../types";
import { toDayString } from "../_lib/date";

export function WeekList({
  days,
  posts,
  noteCountByDay,
  selectedDay,
  onSelect,
}: {
  days: Date[];
  posts: SocialPost[];
  noteCountByDay: Map<string, number>;
  selectedDay: string;
  onSelect: (iso: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {days.map((d) => {
        const dayPosts = posts.filter((p) => new Date(p.scheduledAt).toDateString() === d.toDateString());
        const noteCount = noteCountByDay.get(toDayString(d)) ?? 0;
        const isSelected = d.toISOString() === selectedDay;
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d.toISOString())}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
              isSelected ? "border-brand-500/40 bg-brand-500/8" : "border-white/8 bg-white/2 hover:bg-white/5"
            }`}
          >
            <div>
              <div className="text-[12px] font-medium text-white/85">
                {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div className="mt-0.5 text-[10px] text-white/35">
                {dayPosts.length} konten{noteCount > 0 ? ` · ${noteCount} catatan` : ""}
              </div>
            </div>
            {(dayPosts.length > 0 || noteCount > 0) && (
              <span className="flex items-center gap-1">
                {dayPosts.length > 0 && <span className="size-1.5 rounded-full bg-accent-400" />}
                {noteCount > 0 && (
                  <span className="grid size-4 place-items-center rounded bg-white/10" title={`${noteCount} catatan`}>
                    <StickyNote className="size-2.5 text-white/70" />
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
