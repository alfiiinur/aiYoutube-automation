import {
  CircleDashed,
  Film,
  Gauge,
  Palette,
  TrendingUp,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GoalMetric } from "../../../types";

/* ------------------------------------------------------------------ */
/* Kategori & alur percakapan                                          */
/* ------------------------------------------------------------------ */

export type CategoryId = "konten" | "upload" | "produktivitas" | "kreativitas" | "jangkauan" | "lainnya";

export interface GoalCategory {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  metric: GoalMetric;
  unit: string;
  question: string;
  outcomes: string[];
  targets: number[];
}

export const CATEGORIES: GoalCategory[] = [
  {
    id: "konten",
    label: "Konten",
    icon: Film,
    metric: "videos_ready",
    unit: "video",
    question: "Hasil apa yang paling kamu inginkan dari goal konten ini?",
    outcomes: [
      "Naikkan jumlah video siap tayang",
      "Konsisten upload tiap minggu",
      "Selesaikan seri konten yang tertunda",
    ],
    targets: [5, 10, 20, 30],
  },
  {
    id: "upload",
    label: "Upload",
    icon: Upload,
    metric: "posts_sent",
    unit: "postingan",
    question: "Seberapa sering kamu ingin konten terkirim ke social media?",
    outcomes: [
      "Kirim 1 postingan setiap hari",
      "Kirim 3 postingan per minggu",
      "Jadwalkan konten sebulan penuh",
    ],
    targets: [7, 12, 20, 30],
  },
  {
    id: "produktivitas",
    label: "Produktivitas",
    icon: Gauge,
    metric: "videos_ready",
    unit: "video",
    question: "Apa target produktivitas yang ingin kamu capai?",
    outcomes: [
      "Selesaikan 1 video per hari",
      "Kurangi job yang tertunda",
      "Percepat pipeline produksi",
    ],
    targets: [10, 20, 30, 50],
  },
  {
    id: "kreativitas",
    label: "Kreativitas",
    icon: Palette,
    metric: "videos_ready",
    unit: "video",
    question: "Eksperimen apa yang ingin kamu coba?",
    outcomes: [
      "Coba format konten baru",
      "Eksplorasi gaya visual baru",
      "Bangun seri eksperimen",
    ],
    targets: [3, 6, 12, 20],
  },
  {
    id: "jangkauan",
    label: "Jangkauan",
    icon: TrendingUp,
    metric: "posts_sent",
    unit: "postingan",
    question: "Bagaimana kamu ingin memperluas jangkauan?",
    outcomes: [
      "Tambah frekuensi posting",
      "Konsisten di 2 platform",
      "Coba platform baru",
    ],
    targets: [10, 20, 30, 50],
  },
  {
    id: "lainnya",
    label: "Lainnya",
    icon: CircleDashed,
    metric: "videos_ready",
    unit: "video",
    question: "Apa goal yang ingin kamu kejar?",
    outcomes: [
      "Tingkatkan kualitas video",
      "Rapikan alur produksi",
      "Capai target pribadi",
    ],
    targets: [5, 10, 20, 30],
  },
];

export const METRICS: Record<GoalMetric, string> = {
  videos_ready: "Video siap",
  posts_sent: "Upload terkirim",
};

export type Step = "category" | "outcome" | "target" | "deadline" | "confirm" | "done";

export interface DeadlineChoice {
  id: string;
  label: string;
  iso?: string;
  dateLabel?: string;
}

export const DEADLINE_PRESETS: { id: string; label: string; days: number | null }[] = [
  { id: "in-7", label: "1 minggu", days: 7 },
  { id: "in-30", label: "1 bulan", days: 30 },
  { id: "in-90", label: "3 bulan", days: 90 },
  { id: "none", label: "Tanpa deadline", days: null },
];

export function formatDay(iso?: string): string {
  if (!iso) return "Tanpa deadline";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function deadlineForPreset(id: string): DeadlineChoice {
  const preset = DEADLINE_PRESETS.find((p) => p.id === id) ?? DEADLINE_PRESETS[3];
  if (preset.days == null) return { id: preset.id, label: preset.label };
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + preset.days);
  const iso = date.toISOString();
  return { id: preset.id, label: preset.label, iso, dateLabel: formatDay(iso) };
}

export function parseDeadlineText(text: string): DeadlineChoice | null {
  const t = text.toLowerCase();
  if (t.includes("tanpa") || t.includes("tidak ada")) return deadlineForPreset("none");
  if (t.includes("3 bulan") || t.includes("90 hari")) return deadlineForPreset("in-90");
  if (t.includes("1 bulan") || t.includes("30 hari")) return deadlineForPreset("in-30");
  if (t.includes("1 minggu") || t.includes("7 hari")) return deadlineForPreset("in-7");
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
    parsed.setHours(23, 59, 59, 999);
    const iso = parsed.toISOString();
    return { id: "custom", label: formatDay(iso), iso };
  }
  return null;
}

export function deadlineText(choice: DeadlineChoice): string {
  return choice.dateLabel ? `${choice.label} · ${choice.dateLabel}` : choice.label;
}

export function chatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}
