"use client";

import { ChartLine, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "../../../components/ui";
import { GrowthChart, ScoreRing } from "../../../components/analytics";
import type { ContentAnalytics } from "../../../lib/analytics";
import type { ContentAdvice } from "../../../lib/advice";

const RANGES = [7, 14, 30] as const;

const TREND_META = {
  naik: { icon: TrendingUp, text: "Naik", cls: "bg-white text-black" },
  turun: { icon: TrendingDown, text: "Turun", cls: "border border-white/25 text-white/70" },
  stabil: { icon: Minus, text: "Stabil", cls: "bg-white/10 text-white/75" },
} as const;

export function AnalyticsPanel({
  analytics,
  advice,
  range,
  setRange,
}: {
  analytics: ContentAnalytics | null;
  advice: ContentAdvice | null;
  range: number;
  setRange: (r: number) => void;
}) {
  const trend = analytics?.growth.trend ?? "stabil";
  const TrendIcon = TREND_META[trend].icon;
  const maxStyle = Math.max(1, ...(analytics?.byStyle.map((s) => s.count) ?? [1]));

  return (
    <Card className="mt-4 p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <ChartLine className="size-4 text-white/70" />
          <h2 className="text-sm font-semibold text-white/85">Analisis konten</h2>
        </div>
        {analytics && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${TREND_META[trend].cls}`}
          >
            <TrendIcon className="size-3" />
            {TREND_META[trend].text}{" "}
            {analytics.growth.pctChange > 0 ? "+" : ""}
            {analytics.growth.pctChange}%
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/8 bg-black/30 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                range === r ? "bg-white text-black" : "text-white/45 hover:text-white"
              }`}
            >
              {r} hari
            </button>
          ))}
        </div>
      </div>

      {!analytics ? (
        <div className="relative grid place-items-center overflow-hidden rounded-xl border border-white/8 px-6 py-14 text-center">
          <p className="text-sm text-white/40">Memuat analisis…</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <GrowthChart series={analytics.series} projection={analytics.projection} />
              <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                Kalau ritme {analytics.growth.avgPerDay} video/hari ini berlanjut, 7 hari ke depan
                bertambah <strong className="text-white/70">~{analytics.growth.projectedNext7} video</strong>{" "}
                menjadi total <strong className="text-white/70">{analytics.growth.projectedCumulative} video</strong>.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3">
                <ScoreRing score={advice?.score ?? 0} />
                <div>
                  <p className="text-[11px] text-white/45">Skor kesehatan konten</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/35">
                    Gabungan konsistensi, penyelesaian render, dan tren produksi.
                  </p>
                </div>
              </div>
              {[
                { label: "Rata-rata produksi", value: `${analytics.growth.avgPerDay} video/hari` },
                {
                  label: "Konsistensi",
                  value: `${analytics.growth.consistency}% (${analytics.growth.activeDays}/${analytics.rangeDays} hari aktif)`,
                  bar: analytics.growth.consistency,
                },
                { label: "Tingkat video siap", value: `${analytics.growth.readyRate}%`, bar: analytics.growth.readyRate },
                { label: "Postingan terkirim", value: `${analytics.totals.postsSent} post` },
                {
                  label: "Hari terbaik",
                  value: analytics.growth.bestDay
                    ? `${analytics.growth.bestDay.label} (${analytics.growth.bestDay.jobs} video)`
                    : "—",
                },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-white/6 bg-white/2 px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-white/45">{m.label}</span>
                    <span className="text-[12px] font-medium tabular-nums text-white/85">{m.value}</span>
                  </div>
                  {typeof m.bar === "number" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, m.bar)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/6 bg-white/2 p-3.5">
              <p className="text-[11px] font-medium text-white/60">Gaya paling dipakai</p>
              <div className="mt-2.5 flex flex-col gap-2">
                {analytics.byStyle.length === 0 && (
                  <p className="text-[11px] text-white/35">Belum ada data gaya.</p>
                )}
                {analytics.byStyle.map((s) => (
                  <div key={s.style} className="flex items-center gap-3">
                    <span className="w-24 truncate text-[11px] text-white/45">{s.style}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-white" style={{ width: `${(s.count / maxStyle) * 100}%` }} />
                    </div>
                    <span className="w-5 text-right text-[11px] tabular-nums text-white/50">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/6 bg-white/2 p-3.5">
              <p className="text-[11px] font-medium text-white/60">Hashtag teratas</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {analytics.topHashtags.length === 0 && (
                  <p className="text-[11px] text-white/35">Belum ada hashtag.</p>
                )}
                {analytics.topHashtags.map((t) => (
                  <span
                    key={t.tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/30 px-2.5 py-1 text-[11px] text-white/65"
                  >
                    {t.tag}
                    <span className="tabular-nums text-white/35">×{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
