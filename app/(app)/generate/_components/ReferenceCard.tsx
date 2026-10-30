"use client";

import { Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { Card } from "../../../components/ui";
import type { ReferenceSource } from "../../../types";

type Props = {
  url: string;
  setUrl: (v: string) => void;
  busyRef: boolean;
  error: string | null;
  refs: ReferenceSource[];
  selected: string[];
  setSelected: (v: string[] | ((s: string[]) => string[])) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function ReferenceCard({ url, setUrl, busyRef, error, refs, selected, setSelected, onAdd, onRemove }: Props) {
  return (
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
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="https://youtube.com/watch?v=..."
          className="input-base"
        />
        <button
          onClick={onAdd}
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
                onClick={() => onRemove(r.id)}
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
  );
}
