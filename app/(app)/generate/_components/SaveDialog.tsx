"use client";

import { Loader2, Save, Wand2, X } from "lucide-react";

type Props = {
  prompt: string;
  saveSeries: string;
  setSaveSeries: (v: string) => void;
  newSeriesName: string;
  setNewSeriesName: (v: string) => void;
  savePart: number;
  setSavePart: (v: number) => void;
  saveError: string | null;
  seriesNames: string[];
  submitting: boolean;
  nextPartFor: (seriesName: string) => number;
  onClose: () => void;
  onGenerate: (withSave: boolean) => void;
};

export function SaveDialog({
  prompt,
  saveSeries,
  setSaveSeries,
  newSeriesName,
  setNewSeriesName,
  savePart,
  setSavePart,
  saveError,
  seriesNames,
  submitting,
  nextPartFor,
  onClose,
  onGenerate,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Save className="size-4 text-accent-400" />
            <h2 className="text-sm font-semibold text-white/90">Simpan sebagai skill?</h2>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            className="grid size-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Tutup dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/40">
          Prompt tersimpan bisa dipakai ulang lewat pencarian{" "}
          <kbd className="rounded border border-white/12 bg-white/5 px-1 font-sans text-white/50">
            /
          </kbd>{" "}
          atau dilanjutkan sebagai part berikutnya dalam satu serial.
        </p>

        <p className="mt-3 line-clamp-3 rounded-xl border border-white/8 bg-white/2 p-3 text-[11.5px] leading-relaxed text-white/65">
          {prompt.trim()}
        </p>

        <div className="mt-3 flex flex-col gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] text-white/45">Serial</label>
            <select
              value={saveSeries}
              onChange={(e) => {
                const v = e.target.value;
                setSaveSeries(v);
                setSavePart(v === "none" || v === "__new" ? 1 : nextPartFor(v));
              }}
              className="input-base"
              disabled={submitting}
            >
              <option value="none" className="bg-ink-900">
                Tanpa serial
              </option>
              {seriesNames.map((n) => (
                <option key={n} value={n} className="bg-ink-900">
                  {n} — lanjut part {nextPartFor(n)}
                </option>
              ))}
              <option value="__new" className="bg-ink-900">
                + Serial baru…
              </option>
            </select>
          </div>

          {saveSeries === "__new" && (
            <div>
              <label className="mb-1 block text-[11px] text-white/45">Nama serial baru</label>
              <input
                value={newSeriesName}
                onChange={(e) => setNewSeriesName(e.target.value)}
                placeholder="Mis. Tips Editing"
                className="input-base"
                disabled={submitting}
              />
            </div>
          )}

          {saveSeries !== "none" && (
            <div>
              <label className="mb-1 block text-[11px] text-white/45">Part</label>
              <input
                type="number"
                min={1}
                step={1}
                value={savePart}
                onChange={(e) => setSavePart(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                className="input-base"
                disabled={submitting}
              />
            </div>
          )}
        </div>

        {saveError && <p className="mt-2.5 text-xs text-brand-400">{saveError}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onGenerate(false)}
            disabled={submitting}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
          >
            Jangan simpan
          </button>
          <button
            onClick={() => onGenerate(true)}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {submitting ? "Memproses…" : "Simpan & generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
