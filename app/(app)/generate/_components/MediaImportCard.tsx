"use client";

import type { RefObject } from "react";
import { Film, Image as ImageIcon, Loader2, Music2, Upload, X } from "lucide-react";
import { Card } from "../../../components/ui";
import type { EditorMedia } from "../../../types";
import { MEDIA_ACCEPT, formatBytes } from "../../../lib/media";

type Props = {
  media: EditorMedia[];
  uploadingMedia: boolean;
  mediaError: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onUpload: (files: FileList | File[]) => void;
  onRemove: (url: string) => void;
};

export function MediaImportCard({ media, uploadingMedia, mediaError, inputRef, onUpload, onRemove }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-accent-400" />
          <h2 className="text-sm font-semibold text-white/85">Import media</h2>
        </div>
        <span className="text-[11px] tabular-nums text-white/35">{media.length} file</span>
      </div>
      <p className="mt-1 text-[11px] text-white/40">
        Video, GIF, gambar, atau musik (MP3) bawaan untuk job ini. Media visual otomatis jadi
        klip di editor, audio pertama jadi musik latar.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void onUpload(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploadingMedia}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files.length > 0) {
            e.preventDefault();
            void onUpload(e.dataTransfer.files);
          }
        }}
        className="mt-3 flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-white/12 px-3 py-6 text-center transition hover:border-white/25 hover:bg-white/2 disabled:opacity-60"
      >
        {uploadingMedia ? (
          <Loader2 className="size-5 animate-spin text-accent-400" />
        ) : (
          <Upload className="size-5 text-white/40" />
        )}
        <span className="text-xs text-white/60">
          {uploadingMedia ? "Mengunggah…" : "Seret file ke sini atau klik untuk memilih"}
        </span>
        <span className="text-[10px] text-white/30">MP4 · GIF · PNG/JPG · MP3 — maks 250 MB per file</span>
      </button>

      {mediaError && <p className="mt-2 text-xs text-brand-400">{mediaError}</p>}

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {media.map((m) => (
            <div key={m.url} className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/2">
              <div className="grid aspect-video place-items-center bg-ink-950/60">
                {m.kind === "image" ? (
                  <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                ) : m.kind === "video" ? (
                  <video src={m.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full bg-accent-500/15">
                    <Music2 className="size-4 text-accent-400" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 px-2 py-1.5">
                {m.kind === "video" ? (
                  <Film className="size-3 shrink-0 text-white/35" />
                ) : m.kind === "image" ? (
                  <ImageIcon className="size-3 shrink-0 text-white/35" />
                ) : (
                  <Music2 className="size-3 shrink-0 text-white/35" />
                )}
                <span className="min-w-0 flex-1 truncate text-[10px] text-white/60">{m.name}</span>
                <button
                  onClick={() => onRemove(m.url)}
                  className="grid size-5 shrink-0 place-items-center rounded-md text-white/30 transition hover:bg-white/10 hover:text-brand-400"
                  aria-label={`Hapus ${m.name}`}
                >
                  <X className="size-3" />
                </button>
              </div>
              {m.size != null && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] tabular-nums text-white/70">
                  {formatBytes(m.size)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
