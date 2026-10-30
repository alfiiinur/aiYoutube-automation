"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card } from "../../../components/ui";
import type { SocialPost } from "../../../types";
import type { CalendarView, MonthCells } from "../_hooks/useCalendar";
import { WeekList } from "./WeekList";
import { MonthGrid } from "./MonthGrid";

export function CalendarCard({
  view,
  onViewChange,
  monthLabel,
  onGo,
  days,
  posts,
  postsByDay,
  noteCountByDay,
  monthCells,
  selectedDay,
  todayKey,
  onSelectDay,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  monthLabel: string;
  onGo: (n: number) => void;
  days: Date[];
  posts: SocialPost[];
  postsByDay: Map<string, number>;
  noteCountByDay: Map<string, number>;
  monthCells: MonthCells;
  selectedDay: string;
  todayKey: string;
  onSelectDay: (iso: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onGo(-1)}
          className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white/90"
          aria-label={view === "week" ? "Minggu sebelumnya" : "Bulan sebelumnya"}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-white/90">{monthLabel}</div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-white/35">
            <CalendarDays className="size-3" />
            {view === "week" ? "Tampilan mingguan" : "Tampilan bulanan"}
          </div>
        </div>
        <button
          onClick={() => onGo(1)}
          className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white/90"
          aria-label={view === "week" ? "Minggu berikutnya" : "Bulan berikutnya"}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <div className="inline-flex rounded-lg border border-white/8 bg-white/3 p-0.5">
          {["week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v as "week" | "month")}
              className={`rounded-md px-2.5 py-1 text-[10px] transition ${
                view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {v === "week" ? "Minggu" : "Bulan"}
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <WeekList
          days={days}
          posts={posts}
          noteCountByDay={noteCountByDay}
          selectedDay={selectedDay}
          onSelect={onSelectDay}
        />
      ) : (
        <MonthGrid
          monthCells={monthCells}
          postsByDay={postsByDay}
          noteCountByDay={noteCountByDay}
          selectedDay={selectedDay}
          todayKey={todayKey}
          onSelect={onSelectDay}
        />
      )}
    </Card>
  );
}
