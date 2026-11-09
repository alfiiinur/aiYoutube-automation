"use client";

import { useState } from "react";
import { Film, FolderInput, Image as ImageIcon, Trash2 } from "lucide-react";
import type { MediaFolder, StockMedia } from "../types";
import { formatBytes, formatDuration } from "../lib/media";

export function MediaTile({
  item,
  folders,
  onOpen,
  onSelect,
  onMove,
  onDelete,
  selected,
}: {
  item: StockMedia;
  folders?: MediaFolder[];
  onOpen?: () => void;
  onSelect?: () => void;
  onMove?: (id: string, folderId: string | null) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
}) {
  const [moving, setMoving] = useState(false);
  const clickable = onSelect ?? onOpen;
  const duration = formatDuration(item.duration);
  const canMove = Boolean(onMove && folders);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white/3 transition ${
        selected ? "border-white/60" : "border-white/8 hover:border-white/20"
      }`}
    >
      <button
        type="button"
        onClick={clickable}
        className="relative block aspect-video w-full bg-black/40"
        title={item.name}
      >
        {item.kind === "video" ? (
          <video src={item.url} className="size-full object-cover" muted playsInline preload="metadata" />
        ) : (
          <img src={item.url} alt={item.name} className="size-full object-cover" loading="lazy" />
        )}
        <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-lg bg-black/60 text-white/80">
          {item.kind === "video" ? <Film className="size-3.5" /> : <ImageIcon className="size-3.5" />}
        </span>
        {duration ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/85">
            {duration}
          </span>
        ) : null}
      </button>
      <div className="flex items-center gap-2 px-2.5 py-2">
        {moving && canMove ? (
          <select
            autoFocus
            value={item.folderId ?? ""}
            onChange={(e) => {
              onMove?.(item.id, e.target.value || null);
              setMoving(false);
            }}
            onBlur={() => setMoving(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMoving(false);
            }}
            className="input-base"
            aria-label={`Pindah ${item.name} ke folder`}
          >
            <option value="" className="bg-ink-900">Tanpa folder</option>
            {(folders ?? []).map((f) => (
              <option key={f.id} value={f.id} className="bg-ink-900">
                {f.name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs text-white/80">{item.name}</p>
              <p className="mt-0.5 text-[10px] text-white/35">{formatBytes(item.size)}</p>
            </div>
            {canMove && (
              <button
                type="button"
                onClick={() => setMoving(true)}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/70"
                aria-label={`Pindah ${item.name} ke folder`}
                title="Pindah ke folder"
              >
                <FolderInput className="size-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                aria-label={`Hapus ${item.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
