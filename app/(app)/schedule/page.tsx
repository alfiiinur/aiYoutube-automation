"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui";
import { useScheduleData } from "./_hooks/useScheduleData";
import { useCalendar } from "./_hooks/useCalendar";
import { CalendarCard } from "./_components/CalendarCard";
import { DayDetail } from "./_components/DayDetail";
import { StickyNotes } from "./_components/StickyNotes";

export default function SchedulePage() {
  const { posts, notes, setNotes, postsByDay, noteCountByDay } = useScheduleData();
  const { view, setView, selectedDay, setSelectedDay, days, monthCells, monthLabel, go, todayKey } =
    useCalendar();

  const selected = new Date(selectedDay);

  return (
    <div>
      <PageHeader
        title="Kalender Konten"
        subtitle="Lihat semua konten terjadwal per hari dan pastikan ritme posting di Threads, Instagram, dan Facebook tetap konsisten."
        action={
          <Link
            href="/publish"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85"
          >
            <Plus className="size-4" /> Buat postingan
          </Link>
        }
      />

      <div className={`grid gap-4 ${view === "month" ? "lg:grid-cols-[1.5fr_1fr]" : "lg:grid-cols-[1fr_1.4fr]"}`}>
        <CalendarCard
          view={view}
          onViewChange={setView}
          monthLabel={monthLabel}
          onGo={go}
          days={days}
          posts={posts}
          postsByDay={postsByDay}
          noteCountByDay={noteCountByDay}
          monthCells={monthCells}
          selectedDay={selectedDay}
          todayKey={todayKey}
          onSelectDay={setSelectedDay}
        />

        <div className="flex flex-col gap-3">
          <DayDetail selected={selected} posts={posts} />
          <StickyNotes selected={selected} notes={notes} setNotes={setNotes} />
        </div>
      </div>
    </div>
  );
}
