"use client";

import Link from "next/link";
import { RefreshCw, Lightbulb, Bot } from "lucide-react";
import { Card } from "../../../components/ui";
import type { ContentAdvice } from "../../../lib/advice";

const PRIORITY_DOT = {
  tinggi: "bg-white",
  sedang: "bg-white/50",
  rendah: "bg-white/25",
} as const;

export function AdvicePanel({
  advice,
  loadingAdvice,
  onRefresh,
}: {
  advice: ContentAdvice | null;
  loadingAdvice: boolean;
  onRefresh: () => void;
}) {
  return (
    <Card className="mt-4 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-white/70" />
          <h2 className="text-sm font-semibold text-white/85">Saran & masukan AI</h2>
        </div>
        {advice && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              advice.source === "ai" ? "bg-white text-black" : "bg-white/8 text-white/50"
            }`}
          >
            {advice.source === "ai" ? "dibuat AI" : "mode lokal"}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loadingAdvice}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/75 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${loadingAdvice ? "animate-spin" : ""}`} />
          {loadingAdvice ? "Menganalisis…" : "Minta saran baru"}
        </button>
      </div>

      {!advice ? (
        <p className="py-6 text-center text-sm text-white/40">
          {loadingAdvice ? "AI sedang membaca datamu…" : "Belum ada saran. Klik “Minta saran baru”."}
        </p>
      ) : (
        <>
          <p className="text-[12.5px] leading-relaxed text-white/70">{advice.summary}</p>
          <div className="mt-3 flex flex-col gap-2">
            {advice.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/2 p-3">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${PRIORITY_DOT[tip.priority]}`} />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-white/90">
                    {tip.title}
                    <span className="ml-2 rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-normal text-white/45">
                      {tip.priority}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/50">{tip.detail}</p>
                </div>
              </div>
            ))}
          </div>
          {advice.nextIdeas.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
                <Lightbulb className="size-3.5" /> Ide video berikutnya
              </p>
              <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {advice.nextIdeas.map((idea, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-[11.5px] text-white/60"
                  >
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {advice.notice && (
            <p className="mt-3 text-[11px] text-white/35">
              {advice.notice} Isi <code className="rounded bg-white/8 px-1">OPENAI_API_KEY</code> di{" "}
              <code className="rounded bg-white/8 px-1">.env.local</code> untuk saran AI penuh — lihat{" "}
              <Link href="/settings" className="underline hover:text-white">
                Settings
              </Link>
              .
            </p>
          )}
        </>
      )}
    </Card>
  );
}
