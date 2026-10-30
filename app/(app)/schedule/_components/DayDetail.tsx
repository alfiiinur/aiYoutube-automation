"use client";

import { Card, EmptyState } from "../../../components/ui";
import type { SocialPost } from "../../../types";
import { PLATFORM_LABEL, POST_STATUS_STYLE } from "../_lib/date";

export function DayDetail({ selected, posts }: { selected: Date; posts: SocialPost[] }) {
  const selectedPosts = posts.filter((p) => {
    const d = new Date(p.scheduledAt);
    return d.toDateString() === selected.toDateString();
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <>
      <div className="mb-1">
        <h2 className="text-sm font-semibold text-white/85">
          {selected.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        <p className="mt-0.5 text-[11px] text-white/35">{selectedPosts.length} konten terjadwal</p>
      </div>

      {selectedPosts.length === 0 ? (
        <EmptyState
          title="Tidak ada konten di hari ini"
          hint="Pilih tanggal lain atau buat postingan baru dari Auto Post."
        />
      ) : (
        selectedPosts.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-white/90">{p.jobTitle}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${POST_STATUS_STYLE[p.status]}`}>
                    {PLATFORM_LABEL[p.platform]}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{p.caption}</p>
                <p className="mt-1 text-[10px] text-white/30">
                  {new Date(p.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </p>
              </div>
              {p.status === "sent" && p.postUrl && (
                <a
                  href={p.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-2 py-1 text-[10px] text-lime-400 transition hover:bg-lime-400/10"
                >
                  Lihat
                </a>
              )}
            </div>
          </Card>
        ))
      )}
    </>
  );
}
