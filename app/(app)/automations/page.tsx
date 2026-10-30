"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Play, CalendarClock } from "lucide-react";
import { Card, PageHeader, EmptyState } from "../../components/ui";
import type { Automation } from "../../types";

const SCHEDULES = [
  { cron: "0 9", human: "Setiap hari, 09:00" },
  { cron: "0 19", human: "Setiap hari, 19:00" },
  { cron: "every:720", human: "Setiap 12 jam" },
  { cron: "every:1440", human: "Setiap 24 jam" },
];

export default function AutomationsPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [name, setName] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [schedule, setSchedule] = useState(SCHEDULES[0].cron);
  const [platform, setPlatform] = useState<Automation["platform"]>("youtube");
  const [privacy, setPrivacy] = useState<Automation["privacy"]>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch("/api/automations", { cache: "no-store" }).then((x) => x.json());
    setItems(r.automations ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim() || promptTemplate.trim().length < 8) {
      setError("Nama dan template prompt wajib diisi (prompt min. 8 karakter).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const humanSchedule = SCHEDULES.find((s) => s.cron === schedule)?.human ?? schedule;
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, promptTemplate, cron: schedule, humanSchedule, platform, privacy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat automation");
      setName("");
      setPromptTemplate("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat automation");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (a: Automation) => {
    await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: !a.enabled }),
    });
    await load();
  };

  const runNow = async (a: Automation) => {
    await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runNow: true }),
    });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Automation"
        subtitle="Jadwalkan produksi + upload otomatis. Saat ini berjalan mode simulasi; hubungkan OAuth YouTube untuk upload nyata."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-white/85">Automation baru</h2>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-white/45">Nama</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Series: tips editing harian"
                className="input-base mt-1.5"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/45">Template prompt</label>
              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                rows={4}
                placeholder="Buat video 45 detik tentang {topik} dengan gaya fast-cut, hook pertanyaan kontroversial…"
                className="input-base mt-1.5 resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-white/45">Jadwal</label>
                <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="input-base mt-1.5">
                  {SCHEDULES.map((s) => (
                    <option key={s.cron} value={s.cron} className="bg-ink-900">
                      {s.human}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/45">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Automation["platform"])}
                  className="input-base mt-1.5"
                >
                  {["youtube", "tiktok", "instagram"].map((p) => (
                    <option key={p} value={p} className="bg-ink-900">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/45">Visibilitas</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as Automation["privacy"])}
                className="input-base mt-1.5"
              >
                {["public", "unlisted", "private"].map((p) => (
                  <option key={p} value={p} className="bg-ink-900">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="mt-2 text-xs text-brand-400">{error}</p>}

          <button
            onClick={create}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Buat automation
          </button>
        </Card>

        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <EmptyState
              title="Belum ada automation"
              hint="Buat jadwal produksi berulang di panel kiri — misalnya satu Short setiap pagi."
            />
          ) : (
            items.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white/90">{a.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          a.enabled ? "bg-lime-500/15 text-lime-300" : "bg-white/8 text-white/40"
                        }`}
                      >
                        {a.enabled ? "aktif" : "nonaktif"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/35">{a.promptTemplate}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => runNow(a)}
                      className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/8 hover:text-lime-400"
                      title="Jalankan sekarang"
                    >
                      <Play className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/8 hover:text-brand-400"
                      title="Hapus"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                    <CalendarClock className="size-3" /> {a.humanSchedule}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 capitalize">{a.platform}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5">{a.privacy}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5">{a.runs}× dijalankan</span>
                  {a.nextRunAt && (
                    <span className="text-white/30">
                      berikutnya {new Date(a.nextRunAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  )}
                </div>

                <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-white/45">
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={() => toggle(a)}
                    className="size-3.5 accent-lime-400"
                  />
                  Aktifkan jadwal
                </label>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}