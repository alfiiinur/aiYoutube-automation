"use client";

import { WEEKDAYS, dayKey, startOfDay, toDayString } from "../_lib/date";
import type { MonthCells } from "../_hooks/useCalendar";

export function MonthGrid({
  monthCells,
  postsByDay,
  noteCountByDay,
  selectedDay,
  todayKey,
  onSelect,
}: {
  monthCells: MonthCells;
  postsByDay: Map<string, number>;
  noteCountByDay: Map<string, number>;
  selectedDay: string;
  todayKey: string;
  onSelect: (iso: string) => void;
}) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-[10px] font-medium text-white/35">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: monthCells.offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: monthCells.daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = startOfDay(new Date(monthCells.year, monthCells.month, day));
          const count = postsByDay.get(dayKey(d)) ?? 0;
          const noteCount = noteCountByDay.get(toDayString(d)) ?? 0;
          const isSelected = d.toISOString() === selectedDay;
          const isToday = dayKey(d) === todayKey;
          return (
            <button
              key={day}
              onClick={() => onSelect(d.toISOString())}
              title={`${day} — ${count} konten${noteCount > 0 ? `, ${noteCount} catatan` : ""}`}
              aria-label={`${d.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}, ${count} konten${noteCount > 0 ? `, ${noteCount} catatan` : ""}`}
              className="flex flex-col items-center gap-1 rounded-xl py-1.5 transition hover:bg-white/5"
            >
              <span
                className={`grid size-8 place-items-center rounded-full text-[12px] tabular-nums transition ${
                  isSelected
                    ? "bg-white font-semibold text-black"
                    : count > 0
                      ? "font-medium text-white ring-1 ring-white/70"
                      : isToday
                        ? "font-semibold text-white"
                        : "text-white/45"
                }`}
              >
                {day}
              </span>
              {!isSelected && (count > 0 || noteCount > 0) ? (
                <span className="flex h-1 items-center gap-0.5">
                  {count > 0 && <span className="size-1 rounded-full bg-accent-400" />}
                  {noteCount > 0 && <span className="size-1 rounded-[2px] bg-white" />}
                </span>
              ) : isToday && !isSelected ? (
                <span className="size-1 rounded-full bg-white/40" />
              ) : (
                <span className="size-1" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 border-t border-white/6 px-1 pt-2.5 text-[10px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="grid size-4 place-items-center rounded-full text-[8px] text-white ring-1 ring-white/70">
            1
          </span>
          Ada konten
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-[3px] bg-white" />
          Ada catatan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-white/40" />
          Hari ini
        </span>
      </div>
    </div>
  );
}
