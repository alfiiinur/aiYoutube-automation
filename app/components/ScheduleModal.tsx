"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clampMinute(m: number) {
  const step = Math.min(55, Math.max(0, Math.round(m / 5) * 5));
  return step;
}

export default function ScheduleModal({
  open,
  initial,
  onClose,
  onSelect,
}: {
  open: boolean;
  initial?: string;
  onClose: () => void;
  onSelect: (iso: string) => void;
}) {
  const base = initial ? new Date(initial) : new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(base.getDate());
  const [hour, setHour] = useState(base.getHours());
  const [minute, setMinute] = useState(clampMinute(base.getMinutes()));

  useEffect(() => {
    if (!open) return;
    const d = initial ? new Date(initial) : new Date();
    if (Number.isNaN(d.getTime())) return;
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setHour(d.getHours());
    setMinute(clampMinute(d.getMinutes()));
  }, [open, initial]);

  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = first.getDay();
    const count = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: startWeekday }, () => null);
    for (let d = 1; d <= count; d += 1) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    const realToday = new Date();
    if (d.getMonth() === realToday.getMonth() && d.getFullYear() === realToday.getFullYear()) {
      setSelectedDay(realToday.getDate());
    } else {
      setSelectedDay(1);
    }
  };

  const select = (day: number) => {
    const candidate = new Date(viewYear, viewMonth, day);
    if (candidate < today) return;
    setSelectedDay(day);
  };

  const confirm = () => {
    const d = new Date(viewYear, viewMonth, selectedDay, hour, minute, 0, 0);
    onSelect(d.toISOString());
    onClose();
  };

  const preview = new Date(viewYear, viewMonth, selectedDay, hour, minute);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/12 bg-ink-900 p-5 shadow-2xl shadow-black/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-white">
              <CalendarDays className="size-4 text-accent-400" />
              Pilih tanggal tayang
            </h3>
            <p className="mt-1 text-[11px] text-white/40">
              {preview.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Tutup"
          >
            <span className="grid size-5 place-items-center rounded-full bg-white/6 text-[11px]">✕</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => goMonth(-1)}
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-medium capitalize text-white/85">
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button
            onClick={() => goMonth(1)}
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[10px] font-medium uppercase tracking-wide text-white/30">
              {w}
            </span>
          ))}
          {days.map((d, i) => {
            if (d === null) {
              return <span key={`empty-${i}`} className="h-9" />;
            }
            const date = new Date(viewYear, viewMonth, d);
            const disabled = date < today;
            const active = d === selectedDay;
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button
                key={d}
                onClick={() => select(d)}
                disabled={disabled}
                className={`relative grid h-9 place-items-center rounded-lg text-xs transition ${
                  active
                    ? "bg-gradient-to-br from-brand-500 to-accent-500 font-medium text-white shadow-lg shadow-brand-500/20"
                    : disabled
                      ? "cursor-not-allowed text-white/15"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                }`}
              >
                {d}
                {isToday && !active && <span className="absolute bottom-1 size-1 rounded-full bg-accent-400" />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Clock className="size-4 shrink-0 text-white/40" />
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="input-base"
            aria-label="Jam"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h} className="bg-ink-900">
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <span className="text-white/30">:</span>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="input-base"
            aria-label="Menit"
          >
            {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
              <option key={m} value={m} className="bg-ink-900">
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span className="ml-1 text-[11px] text-white/35">WIB</span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            Batal
          </button>
          <button
            onClick={confirm}
            className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
          >
            Simpan jadwal
          </button>
        </div>
      </div>
    </div>
  );
}
