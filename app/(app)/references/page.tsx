"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, ExternalLink, Link2 } from "lucide-react";
import { Card, PageHeader, EmptyState } from "../../components/ui";
import type { ReferenceSource } from "../../types";

export default function ReferencesPage() {
  const [refs, setRefs] = useState<ReferenceSource[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch("/api/references", { cache: "no-store" }).then((x) => x.json());
    setRefs(r.references ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      setUrl("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambah referensi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/references/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Referensi"
        subtitle="Kumpulan link pembanding. Metadata dan insight dipakai generator untuk menajamkan hook serta struktur cerita."
      />

      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="https://youtube.com/watch?v=… atau https://instagram.com/reel/…"
              className="input-base pl-9"
            />
          </div>
          <button
            onClick={add}
            disabled={busy || !url.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Analisis
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-brand-400">{error}</p>}
      </Card>

      <div className="mt-4">
        {refs.length === 0 ? (
          <EmptyState title="Belum ada referensi" hint="Tempel link YouTube atau Instagram di atas untuk mulai menganalisis pola konten." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {refs.map((r) => (
              <Card key={r.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                    {r.platform}
                  </span>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-lg p-1 text-white/25 transition hover:bg-white/8 hover:text-brand-400"
                    aria-label="Hapus"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {r.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbnail}
                    alt=""
                    className="mt-3 aspect-video w-full rounded-lg object-cover opacity-90"
                  />
                )}

                <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-white/90">{r.title}</h3>
                <p className="mt-0.5 text-[11px] text-white/35">{r.author ?? "Sumber eksternal"}</p>

                <ul className="mt-2.5 flex flex-1 flex-col gap-1">
                  {r.insights.slice(0, 3).map((i) => (
                    <li key={i} className="text-[11px] leading-relaxed text-white/45">
                      • {i}
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {r.tags.slice(0, 5).map((t) => (
                    <span key={t} className="rounded-full bg-accent-500/12 px-2 py-0.5 text-[10px] text-accent-400">
                      {t}
                    </span>
                  ))}
                </div>

                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-white/40 transition hover:text-white"
                >
                  Buka sumber <ExternalLink className="size-3" />
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}