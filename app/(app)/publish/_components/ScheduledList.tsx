"use client";

import { Trash2, Link2, RefreshCw, ExternalLink } from "lucide-react";
import { Card, EmptyState } from "../../../components/ui";
import type { SocialPost } from "../../../types";
import { PLATFORM_LABEL, POST_STATUS_LABEL, POST_STATUS_STYLE } from "../_lib/constants";

export function ScheduledList({
  posts,
  loading,
  onRefresh,
  onDelete,
}: {
  posts: SocialPost[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/85">Konten terjadwal</h2>
        <button onClick={onRefresh} className="inline-flex items-center gap-1.5 text-[11px] text-white/40 transition hover:text-white/80">
          <RefreshCw className="size-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/4" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="Belum ada konten terjadwal"
          hint="Buat postingan dari job Siap, atur jadwal, lalu lihat riwayatnya di sini."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link2 className="size-3.5 shrink-0 text-white/35" />
                    <p className="truncate text-sm font-medium text-white/90">{p.jobTitle}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${POST_STATUS_STYLE[p.status]}`}>
                      {POST_STATUS_LABEL[p.status]}
                      {p.simulated && p.status === "sent" ? " (simulasi)" : ""}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{p.caption}</p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {PLATFORM_LABEL[p.platform]} · tayang {new Date(p.scheduledAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    {p.publishedAt ? ` · dikirim ${new Date(p.publishedAt).toLocaleString("id-ID", { timeStyle: "short" })}` : ""}
                  </p>
                  {p.error && <p className="mt-1 text-[10px] text-brand-400">{p.error}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {p.postUrl && (
                    <a href={p.postUrl} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/8 hover:text-white/80" aria-label="Buka postingan">
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  <button onClick={() => onDelete(p.id)} className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/8 hover:text-brand-400" aria-label="Hapus postingan">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
