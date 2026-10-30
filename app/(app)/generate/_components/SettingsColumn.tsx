"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Card } from "../../../components/ui";
import type { AspectRatio, ReferenceSource } from "../../../types";
import { MAX_DURATION_SEC, MIN_DURATION_SEC, MODELS, RATIOS, SLIDER_MAX_SEC, STYLES, VOICES } from "../_lib/constants";
import { formatDurationID, secToMinText } from "../_lib/format";

type Props = {
  settingsOpen: boolean;
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;
  durationSec: number;
  setDurationSec: (v: number) => void;
  durationMinText: string;
  setDurationMinText: (v: string) => void;
  setDuration: (sec: number) => void;
  style: string;
  setStyle: (v: string) => void;
  voice: string;
  setVoice: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  submitting: boolean;
  onGenerate: () => void;
  selectedRefs: ReferenceSource[];
};

export function SettingsColumn({
  settingsOpen,
  aspectRatio,
  setAspectRatio,
  durationSec,
  setDurationSec,
  durationMinText,
  setDurationMinText,
  setDuration,
  style,
  setStyle,
  voice,
  setVoice,
  model,
  setModel,
  submitting,
  onGenerate,
  selectedRefs,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {settingsOpen && (
      <>
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white/85">Pengaturan render</h2>

        <div className="mt-4 flex flex-col gap-3.5">
          <div>
            <label className="text-[11px] text-white/45">Aspect ratio</label>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`rounded-lg border py-1.5 text-[11px] transition ${
                    aspectRatio === r
                      ? "border-brand-500/50 bg-brand-500/15 text-white"
                      : "border-white/8 bg-white/2 text-white/50 hover:text-white/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-white/45">Durasi</label>
              <span className="text-[11px] tabular-nums text-white/70">
                {formatDurationID(durationSec)}
              </span>
            </div>
            <input
              type="range"
              min={MIN_DURATION_SEC}
              max={SLIDER_MAX_SEC}
              step={5}
              value={Math.min(durationSec, SLIDER_MAX_SEC)}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2 w-full accent-brand-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0.2}
                max={10}
                step={0.5}
                value={durationMinText}
                onChange={(e) => {
                  setDurationMinText(e.target.value);
                  const mins = Number(e.target.value);
                  if (e.target.value !== "" && Number.isFinite(mins) && mins > 0) {
                    setDurationSec(
                      Math.max(
                        MIN_DURATION_SEC,
                        Math.min(MAX_DURATION_SEC, Math.round(mins * 60)),
                      ),
                    );
                  }
                }}
                onBlur={() => setDurationMinText(secToMinText(durationSec))}
                className="input-base"
                aria-label="Durasi dalam menit"
              />
              <span className="shrink-0 text-[11px] text-white/45">menit</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/30">
              Geser untuk 10–180 detik, atau ketik manual di atas hingga 10 menit.
            </p>
          </div>

          <div>
            <label className="text-[11px] text-white/45">Gaya visual</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-base mt-1.5">
              {STYLES.map((s) => (
                <option key={s} value={s} className="bg-ink-900">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-white/45">Voice over</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="input-base mt-1.5">
              {VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-ink-900">
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-white/45">Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="input-base mt-1.5">
              {MODELS.map((m) => (
                <option key={m} value={m} className="bg-ink-900">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={submitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {submitting ? "Menyiapkan pipeline…" : "Generate video"}
        </button>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white/85">Referensi terpilih</h2>
        <p className="mt-1 text-[11px] text-white/40">
          {selectedRefs.length === 0
            ? "Belum ada. Generator akan bekerja hanya dari prompt."
            : `${selectedRefs.length} referensi akan dipakai untuk menyusun hook & struktur.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedRefs.flatMap((r) => r.tags).slice(0, 12).map((t) => (
            <span key={t} className="rounded-full bg-accent-500/12 px-2 py-0.5 text-[10px] text-accent-400">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/8 bg-white/2 p-3">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-lime-400" />
          <p className="text-[11px] leading-relaxed text-white/45">
            Gunakan referensi sebagai acuan struktur, bukan menyalin aset. Semua visual dibuat ulang.
          </p>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}
