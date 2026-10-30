"use client";

import type { DayPoint, ProjectionPoint } from "../lib/analytics";

/** Grafik pertumbuhan: bar harian + garis kumulatif + garis proyeksi (SVG murni). */
export function GrowthChart({
  series,
  projection,
}: {
  series: DayPoint[];
  projection: ProjectionPoint[];
}) {
  const W = 640;
  const H = 230;
  const PAD = { l: 34, r: 12, t: 12, b: 26 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  const cumLine: { label: string; value: number; proj?: boolean }[] = [
    ...series.map((p) => ({ label: p.label, value: p.cumulative })),
    ...projection.map((p) => ({ label: p.label, value: p.cumulative, proj: true })),
  ];
  const maxCum = Math.max(1, ...cumLine.map((p) => p.value));
  const maxDaily = Math.max(1, ...series.map((p) => p.jobs));

  const x = (i: number) => PAD.l + (iw * i) / Math.max(1, cumLine.length - 1);
  const yCum = (v: number) => PAD.t + ih - (ih * v) / (maxCum * 1.1);
  // Tinggi bar dinormalisasi ke max 45% tinggi area agar tidak menenggelamkan garis
  const barH = (v: number) => (ih * 0.45 * v) / maxDaily;

  const splitIdx = series.length - 1;
  const actualLine = cumLine
    .slice(0, splitIdx + 1)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yCum(p.value).toFixed(1)}`)
    .join(" ");
  const projPath = cumLine
    .slice(splitIdx)
    .map((p, k) => {
      const i = splitIdx + k;
      return `${k === 0 ? "M" : "L"}${x(i).toFixed(1)},${yCum(p.value).toFixed(1)}`;
    })
    .join(" ");
  const areaPath = `${actualLine} L${x(splitIdx).toFixed(1)},${(PAD.t + ih).toFixed(1)} L${x(0).toFixed(1)},${(PAD.t + ih).toFixed(1)} Z`;

  const gridTicks = [0, 1, 2, 3, 4];
  const labelEvery = Math.max(1, Math.ceil(series.length / 6));

  const slotW = iw / Math.max(1, cumLine.length - 1);
  const bw = Math.min(18, Math.max(3, slotW * 0.45));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik pertumbuhan konten">
        {gridTicks.map((t) => {
          const y = PAD.t + (ih * t) / 4;
          const val = Math.round(((maxCum * 1.1 * (4 - t)) / 4) * 10) / 10;
          return (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.35)">
                {val}
              </text>
            </g>
          );
        })}

        {/* garis batas mulai proyeksi */}
        <line
          x1={x(splitIdx)}
          x2={x(splitIdx)}
          y1={PAD.t}
          y2={PAD.t + ih}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="3 4"
          strokeWidth={1}
        />

        {/* bar harian */}
        {series.map((p, i) => {
          const h = barH(p.jobs);
          return (
            <g key={p.date}>
              <rect
                x={x(i) - bw / 2}
                y={PAD.t + ih - h}
                width={bw}
                height={Math.max(p.jobs > 0 ? 2 : 0, h)}
                rx={Math.min(3, bw / 3)}
                fill={p.jobs > 0 ? "rgba(255,255,255,0.16)" : "transparent"}
              >
                <title>{`${p.label}: ${p.jobs} video, ${p.ready} siap`}</title>
              </rect>
            </g>
          );
        })}

        {/* area + garis kumulatif */}
        <path d={areaPath} fill="rgba(255,255,255,0.06)" />
        <path
          d={actualLine}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* garis proyeksi */}
        <path
          d={projPath}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.6}
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        <circle cx={x(splitIdx)} cy={yCum(cumLine[splitIdx]?.value ?? 0)} r={3} fill="#fff" />

        {/* label sumbu x */}
        {series.map((p, i) =>
          i % labelEvery === 0 || i === series.length - 1 ? (
            <text
              key={p.date}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(255,255,255,0.35)"
            >
              {p.label}
            </text>
          ) : null,
        )}
        <text
          x={x(cumLine.length - 1)}
          y={H - 8}
          textAnchor="end"
          fontSize={9}
          fill="rgba(255,255,255,0.5)"
        >
          +7hr
        </text>
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-4 text-[11px] text-white/45">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-white/25" /> Video dibuat / hari
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-white" /> Total kumulatif
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-white/50" /> Proyeksi 7 hari
        </span>
      </div>
    </div>
  );
}

/** Lingkar skor kesehatan 0-100. */
export function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative inline-grid size-14 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
        <circle
          cx={28}
          cy={28}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      <span className="text-sm font-semibold tabular-nums text-white">{score}</span>
    </div>
  );
}
