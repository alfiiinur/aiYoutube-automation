"use client";

import { Loader2 } from "lucide-react";
import { EmptyState } from "../../../components/ui";
import { MediaTile } from "../../../components/MediaTile";
import type { MediaFolder, StockMedia } from "../../../types";

export function StockGrid({
  media,
  folders,
  loading,
  uploading,
  onOpen,
  onMove,
  onDelete,
}: {
  media: StockMedia[];
  folders: MediaFolder[];
  loading: boolean;
  uploading: boolean;
  onOpen: (item: StockMedia) => void;
  onMove: (id: string, folderId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/4" />
        ))}
      </div>
    );
  }

  if (media.length === 0 && !uploading) {
    return (
      <EmptyState
        title="Folder ini masih kosong"
        hint="Upload stock video atau gambar lewat kotak di atas."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {uploading && (
        <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-white/15 bg-white/3 text-xs text-white/45">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Mengunggah…
          </span>
        </div>
      )}
      {media.map((m) => (
        <MediaTile
          key={m.id}
          item={m}
          folders={folders}
          onOpen={() => onOpen(m)}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
