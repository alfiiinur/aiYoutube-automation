"use client";

import { useRef, useState } from "react";
import type { EditorMedia } from "../../../types";
import { isSupportedMediaFile, probeMediaDuration } from "../../../lib/media";

/** Impor media referensi (video/GIF/gambar/audio) via /api/uploads. */
export function useMediaImport() {
  const [media, setMedia] = useState<EditorMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const uploadMediaFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(isSupportedMediaFile);
    if (list.length === 0) {
      setMediaError("File tidak didukung. Pilih video, GIF, gambar, atau audio (MP4/GIF/PNG/JPG/MP3).");
      return;
    }
    setMediaError(null);
    setUploadingMedia(true);
    try {
      for (const file of list) {
        const duration = await probeMediaDuration(file);
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Gagal mengunggah ${file.name}`);
        const asset = data.asset as EditorMedia;
        setMedia((prev) => [...prev, asset.kind === "image" ? asset : { ...asset, duration }]);
      }
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : "Gagal mengunggah media");
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (url: string) => {
    setMedia((prev) => prev.filter((m) => m.url !== url));
  };

  return {
    media, setMedia, uploadingMedia, mediaError, mediaInputRef,
    uploadMediaFiles, removeMedia,
  };
}

export type MediaImport = ReturnType<typeof useMediaImport>;
