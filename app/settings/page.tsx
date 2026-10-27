"use client";

import { useEffect, useState } from "react";
import { Check, X, KeyRound, ShieldCheck, Cpu } from "lucide-react";
import { Card, PageHeader } from "../components/ui";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI / LLM",
    env: "OPENAI_API_KEY",
    purpose: "Menulis script, hook, dan caption dengan kualitas produksi.",
  },
  {
    id: "youtube",
    name: "YouTube Data API",
    env: "YOUTUBE_CLIENT_ID",
    purpose: "Upload otomatis dan membaca analytics channel.",
  },
  {
    id: "render",
    name: "Render provider",
    env: "RENDER_API_KEY",
    purpose: "Merender MP4 nyata dari storyboard (mis. Remotion / Shotstack).",
  },
  {
    id: "tts",
    name: "Voice / TTS",
    env: "ELEVENLABS_API_KEY",
    purpose: "Voice over bahasa Indonesia dengan kloning suara.",
  },
];

export default function SettingsPage() {
  const [health, setHealth] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setHealth(d.connected ?? {}))
      .catch(() => setHealth({}));
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Status integrasi provider. Kunci dibaca dari environment variable di server — tidak pernah dikirim ke browser."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-accent-400" />
            <h2 className="text-sm font-semibold text-white/85">Provider</h2>
          </div>
                    <p className="mt-1 text-[11px] text-white/40">
            Buat file <code className="rounded bg-white/8 px-1">.env.local</code> di root project lalu isi nilai variabelnya.
            Lihat <code className="rounded bg-white/8 px-1">README.md</code> untuk daftar lengkap variabel.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {PROVIDERS.map((p) => {
              const on = Boolean(health[p.env]);
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/2 p-3"
                >
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                      on ? "bg-lime-500/15 text-lime-400" : "bg-white/8 text-white/35"
                    }`}
                  >
                    {on ? <Check className="size-3" /> : <X className="size-3" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-white/85">{p.name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">{p.purpose}</p>
                    <code className="mt-1 inline-block rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/45">
                      {p.env}
                    </code>
                  </div>
                  <span className={`ml-auto shrink-0 text-[10px] ${on ? "text-lime-400" : "text-white/30"}`}>
                    {on ? "terhubung" : "belum"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-sky-300" />
              <h2 className="text-sm font-semibold text-white/85">Mode saat ini</h2>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/50">
              Aplikasi berjalan dalam <strong className="text-white/80">mode lokal</strong>: generator script dan
              storyboard aktif penuh, sementara render video serta upload disimulasikan. Data disimpan di{" "}
              <code className="rounded bg-white/8 px-1">data/db.json</code>.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-[11px] text-white/45">
              <li>• Tanpa database eksternal — cukup filesystem.</li>
              <li>• Pipeline job maju otomatis berdasarkan waktu.</li>
              <li>• Metadata referensi diambil dari oEmbed resmi / Open Graph website.</li>
              <li>• Upload, render, dan TTS aktif otomatis setelah kunci API diisi.</li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-lime-400" />
              <h2 className="text-sm font-semibold text-white/85">Catatan keamanan</h2>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/50">
              Kunci API hanya berada di sisi server. Endpoint{" "}
              <code className="rounded bg-white/8 px-1">/api/settings</code> hanya mengembalikan status boolean, bukan nilai
              kuncinya.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}