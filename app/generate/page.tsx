"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles, Loader2, Link2, Wand2 } from "lucide-react";
import { Card, PageHeader } from "../components/ui";
import type { AspectRatio, ReferenceSource } from "../types";

const STYLES = ["cinematic", "fast-cut", "documentary", "motion-graphic", "anime", "screen-record"];
const VOICES = [
  { id: "female-id", label: "Wanita ID — energik" },
  { id: "male-id", label: "Pria ID — hangat" },
  { id: "female-en", label: "Female EN — bright" },
  { id: "male-en", label: "Male EN — deep" },
];
const RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5"];
const MODELS = ["studio-v1", "studio-v1-turbo", "cinema-pro"];

const IDEAS = [
  "5 kesalahan editing video yang bikin retention drop",
  "Cara riset konten pakai 3 video kompetitor dalam 10 menit",
  "Behind the scenes setup studio rumahan budget 2 juta",
];

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [refs, setRefs] = useState<ReferenceSource[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [durationSec, setDurationSec] = useState(45);
  const [style, setStyle] = useState("cinematic");
  const [voice, setVoice] = useState("female-id");
  const [model, setModel] = useState("studio-v1");
  const [busyRef, setBusyRef] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRefs = async () => {
    const r = await fetch("/api/references", { cache: "no-store" }).then((x) => x.json());
    setRefs(r.references ?? []);
  };

  useEffect(() => {
    loadRefs();
  }, []);

  const addReference = async () => {
    if (!url.trim()) return;
    setBusyRef(true);
    setError(null);
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menganalisis link");
      await loadRefs();
      setSelected((s) => (s.includes(data.reference.id) ? s : [...s, data.reference.id]));
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusyRef(false);
    }
  };

  const removeReference = async (id: string) => {
    await fetch(`/api/references/${id}`, { method: "DELETE" });
    setSelected((s) => s.filter((x) => x !== id));
    await loadRefs();
  };

  const submit = async () => {
    if (prompt.trim().length < 8) {
      setError("Prompt minimal 8 karakter.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, referenceIds: selected, aspectRatio, durationSec, style, voice, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat job");
      router.push(`/jobs/${data.job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  };

  const selectedRefs = useMemo(() => refs.filter((r) => selected.includes(r.id)), [refs, selected]);

  return (
    <div>
      <PageHeader
        title="Generate Video"
        subtitle="Tulis prompt, tempel link YouTube/Instagram sebagai referensi gaya, lalu jalankan pipeline produksi."
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <label className="text-xs font-medium text-white/60">Prompt / ide video</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Contoh: video pendek tentang cara memilih mikrofon untuk podcaster pemula, gaya cinematic, bahasa Indonesia santai..."
              className="input-base mt-2 resize-y"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1 text-[11px] text-white/50 transition hover:border-white/16 hover:text-white/80"
                >
                  {idea.slice(0, 42)}…
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-accent-400" />
              <h2 className="text-sm font-semibold text-white/85">Referensi tambahan</h2>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              Tempel link YouTube, Instagram, TikTok, atau artikel. Sistem mengambil metadata resmi lalu menyimpulkan
              pola hook dan struktur.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReference()}
                placeholder="https://youtube.com/watch?v=..."
                className="input-base"
              />
              <button
                onClick={addReference}
                disabled={busyRef || !url.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/6 px-3.5 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                {busyRef ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Tambah
              </button>
            </div>

            {error && <p className="mt-2 text-xs text-brand-400">{error}</p>}

            <div className="mt-4 flex flex-col gap-2">
              {refs.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/35">
                  Belum ada referensi tersimpan.
                </p>
              )}
              {refs.map((r) => {
                const active = selected.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                      active ? "border-brand-500/40 bg-brand-500/8" : "border-white/8 bg-white/2"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setSelected((s) => (active ? s.filter((x) => x !== r.id) : [...s, r.id]))
                      }
                      className="mt-0.5 size-4 shrink-0 accent-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white/85">{r.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-white/35">
                        {r.platform}
                        {r.author ? ` · ${r.author}` : ""}
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-0.5">
                        {r.insights.slice(0, 2).map((i) => (
                          <li key={i} className="text-[11px] leading-relaxed text-white/45">
                            • {i}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => removeReference(r.id)}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                      aria-label="Hapus referensi"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
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
                  <span className="text-[11px] tabular-nums text-white/70">{durationSec}s</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="mt-2 w-full accent-brand-500"
                />
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
              onClick={submit}
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}