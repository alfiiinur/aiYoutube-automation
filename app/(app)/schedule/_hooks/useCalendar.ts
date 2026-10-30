"use client";

import { useMemo, useState } from "react";
import { addDays, dayKey, startOfDay } from "../_lib/date";

export type CalendarView = "week" | "month";

export interface MonthCells {
  year: number;
  month: number;
  offset: number;
  daysInMonth: number;
}

export function useCalendar() {
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()).toISOString());
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()).toISOString());

  // Tampilan mingguan: list 7 hari dari anchor.
  const days = useMemo(() => {
    const base = new Date(anchor);
    return Array.from({ length: 7 }, (_, i) => startOfDay(addDays(base, i)));
  }, [anchor]);

  // Tampilan bulanan: sel kalender untuk bulan yang memuat anchor.
  const monthCells = useMemo<MonthCells>(() => {
    const base = new Date(anchor);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const offset = (firstDow + 6) % 7; // Senin dulu
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { year, month, offset, daysInMonth };
  }, [anchor]);

  const monthLabel = useMemo(() => {
    const base = new Date(anchor);
    return base.toLocaleString("id-ID", { month: "long", year: "numeric" });
  }, [anchor]);

  const go = (n: number) => {
    const base = new Date(anchor);
    if (view === "week") {
      base.setDate(base.getDate() + n * 7);
    } else {
      base.setDate(1);
      base.setMonth(base.getMonth() + n);
    }
    setAnchor(startOfDay(base).toISOString());
  };

  const todayKey = dayKey(startOfDay(new Date()));

  return { view, setView, selectedDay, setSelectedDay, days, monthCells, monthLabel, go, todayKey };
}
