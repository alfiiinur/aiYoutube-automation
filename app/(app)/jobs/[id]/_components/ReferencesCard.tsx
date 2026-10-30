"use client";

import { Card } from "../../../../components/ui";
import type { ReferenceSource } from "../../../../types";

export function ReferencesCard({ refs }: { refs: ReferenceSource[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-white/85">Referensi dipakai</h2>
      {refs.length === 0 ? (
        <p className="mt-2 text-[11px] text-white/35">
          Job ini dibuat tanpa referensi eksternal — murni dari prompt.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {refs.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/8 bg-white/2 p-2.5 transition hover:border-white/16"
            >
              <p className="line-clamp-2 text-[11.5px] font-medium text-white/80">{r.title}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/30">{r.platform}</p>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
