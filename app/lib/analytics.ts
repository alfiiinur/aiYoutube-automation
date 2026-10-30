import { prisma } from "@/app/lib/db";

export interface DayPoint {
  date: string; // YYYY-MM-DD
  label: string; // "28/10"
  jobs: number; // video dibuat hari itu
  ready: number; // yang sudah berstatus ready
  posts: number; // postingan terkirim hari itu
  cumulative: number; // kumulatif video dibuat s.d. hari itu
}

export interface ProjectionPoint {
  date: string;
  label: string;
  cumulative: number;
}

export interface ContentAnalytics {
  rangeDays: number;
  series: DayPoint[];
  projection: ProjectionPoint[];
  totals: {
    jobs: number;
    ready: number;
    postsSent: number;
    totalSeconds: number;
  };
  growth: {
    avgPerDay: number;
    readyRate: number; // 0-100
    consistency: number; // % hari aktif dalam rentang, 0-100
    pctChange: number; // perbandingan paruh kedua vs paruh pertama (%)
    trend: "naik" | "turun" | "stabil";
    activeDays: number;
    bestDay: { date: string; label: string; jobs: number } | null;
    projectedNext7: number; // estimasi video baru 7 hari ke depan
    projectedCumulative: number; // estimasi total kumulatif 7 hari ke depan
  };
  byStyle: { style: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topHashtags: { tag: string; count: number }[];
  avgDurationSec: number;
}

const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelOf(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getContentAnalytics(rangeDaysInput?: number): Promise<ContentAnalytics> {
  const rangeDays = [7, 14, 30].includes(Number(rangeDaysInput)) ? Number(rangeDaysInput) : 14;

  const [jobRows, postRows] = await Promise.all([
    prisma.videoJob.findMany({
      select: { createdAt: true, status: true, style: true, durationSec: true, hashtags: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.socialPost.findMany({
      select: { scheduledAt: true, status: true },
    }),
  ]);

  // Bangun kerangka hari dalam rentang (termasuk hari ini)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { key: string; label: string; start: number; end: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    days.push({
      key: dayKey(d),
      label: labelOf(d),
      start: d.getTime(),
      end: d.getTime() + DAY_MS,
    });
  }
  const rangeStart = days[0]?.start ?? Date.now();

  // Hitung kumulatif sebelum rentang agar garis kumulatif kontinu
  const beforeCount = jobRows.filter((j) => j.createdAt.getTime() < rangeStart).length;

  const jobsByDay = new Map<string, { jobs: number; ready: number }>();
  const postsByDay = new Map<string, number>();
  for (const d of days) {
    jobsByDay.set(d.key, { jobs: 0, ready: 0 });
    postsByDay.set(d.key, 0);
  }
  // Index hari berdasarkan timestamp untuk pencocokan cepat
  const dayIndexByTime = (ms: number): string | null => {
    for (const d of days) {
      if (ms >= d.start && ms < d.end) return d.key;
    }
    return null;
  };

  for (const j of jobRows) {
    const key = dayIndexByTime(j.createdAt.getTime());
    if (!key) continue;
    const slot = jobsByDay.get(key)!;
    slot.jobs += 1;
    if (j.status === "ready") slot.ready += 1;
  }
  for (const p of postRows) {
    if (p.status !== "sent") continue;
    const key = dayIndexByTime(p.scheduledAt.getTime());
    if (!key) continue;
    postsByDay.set(key, (postsByDay.get(key) ?? 0) + 1);
  }

  let running = beforeCount;
  const series: DayPoint[] = days.map((d) => {
    const slot = jobsByDay.get(d.key)!;
    running += slot.jobs;
    return {
      date: d.key,
      label: d.label,
      jobs: slot.jobs,
      ready: slot.ready,
      posts: postsByDay.get(d.key) ?? 0,
      cumulative: running,
    };
  });

  const jobsInRange = series.reduce((s, p) => s + p.jobs, 0);
  const readyInRange = jobRows.filter((j) => j.status === "ready").length;
  const postsSent = postRows.filter((p) => p.status === "sent").length;
  const totalSeconds = jobRows.reduce((s, j) => s + (j.durationSec ?? 0), 0);

  const activeDays = series.filter((p) => p.jobs > 0).length;
  const avgPerDay = jobsInRange / rangeDays;
  const readyRate = jobRows.length ? (readyInRange / jobRows.length) * 100 : 0;
  const consistency = (activeDays / rangeDays) * 100;

  // Pertumbuhan: paruh kedua vs paruh pertama rentang
  const half = Math.floor(rangeDays / 2);
  const firstHalf = series.slice(0, half).reduce((s, p) => s + p.jobs, 0);
  const secondHalf = series.slice(half).reduce((s, p) => s + p.jobs, 0);
  const pctChange =
    firstHalf === 0 ? (secondHalf > 0 ? 100 : 0) : ((secondHalf - firstHalf) / firstHalf) * 100;
  const trend: ContentAnalytics["growth"]["trend"] =
    pctChange > 10 ? "naik" : pctChange < -10 ? "turun" : "stabil";

  // Proyeksi 7 hari ke depan: regresi linear sederhana pada deret harian,
  // dibatasi bawah 0 agar tidak negatif.
  const n = series.length;
  const xs = series.map((_, i) => i);
  const ys = series.map((p) => p.jobs);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  let projCum = running;
  const projection: ProjectionPoint[] = [];
  for (let k = 1; k <= 7; k++) {
    const d = new Date(today.getTime() + k * DAY_MS);
    const forecastDaily = Math.max(0, slope * (n - 1 + k) + intercept);
    // Campur dengan rata-rata agar proyeksi tidak liar saat data sedikit
    const blended = n < 7 ? avgPerDay : forecastDaily * 0.6 + avgPerDay * 0.4;
    projCum += blended;
    projection.push({
      date: dayKey(d),
      label: labelOf(d),
      cumulative: Math.round(projCum * 10) / 10,
    });
  }
  const projectedNext7 = Math.max(0, Math.round((projCum - running) * 10) / 10);

  let bestDay: ContentAnalytics["growth"]["bestDay"] = null;
  for (const p of series) {
    if (p.jobs > 0 && (!bestDay || p.jobs > bestDay.jobs)) {
      bestDay = { date: p.date, label: p.label, jobs: p.jobs };
    }
  }

  // Breakdown gaya & status (keseluruhan, bukan hanya rentang)
  const styleMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  for (const j of jobRows) {
    styleMap.set(j.style || "lainnya", (styleMap.get(j.style || "lainnya") ?? 0) + 1);
    statusMap.set(j.status, (statusMap.get(j.status) ?? 0) + 1);
    for (const t of j.hashtags ?? []) {
      const tag = String(t).trim();
      if (!tag) continue;
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }
  const byStyle = [...styleMap.entries()]
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const byStatus = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
  const topHashtags = [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    rangeDays,
    series,
    projection,
    totals: {
      jobs: jobRows.length,
      ready: readyInRange,
      postsSent,
      totalSeconds,
    },
    growth: {
      avgPerDay: Math.round(avgPerDay * 100) / 100,
      readyRate: Math.round(readyRate * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      pctChange: Math.round(pctChange * 10) / 10,
      trend,
      activeDays,
      bestDay,
      projectedNext7,
      projectedCumulative: Math.round(projCum * 10) / 10,
    },
    byStyle,
    byStatus,
    topHashtags,
    avgDurationSec: jobRows.length ? Math.round(totalSeconds / jobRows.length) : 0,
  };
}
