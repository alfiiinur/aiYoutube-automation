"use client";

import { useCallback, useEffect, useState } from "react";
import type { MediaFolder, StockMedia } from "../../../types";
import { uploadStockFiles } from "../../../lib/stock-upload";

export type FolderFilter = "all" | "none" | string;

export function useStockLibrary() {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [unfiledCount, setUnfiledCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [active, setActive] = useState<FolderFilter>("all");
  const [media, setMedia] = useState<StockMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    const r = await fetch("/api/stock/folders", { cache: "no-store" }).then((x) => x.json());
    setFolders(r.folders ?? []);
    setUnfiledCount(r.unfiledCount ?? 0);
    setTotalCount(r.totalCount ?? 0);
  }, []);

  const loadMedia = useCallback(async (filter: FolderFilter) => {
    const q = filter === "all" ? "" : `?folderId=${filter === "none" ? "none" : filter}`;
    const r = await fetch(`/api/stock${q}`, { cache: "no-store" }).then((x) => x.json());
    setMedia(r.media ?? []);
  }, []);

  const refresh = useCallback(
    async (filter: FolderFilter) => {
      await Promise.all([loadFolders(), loadMedia(filter)]);
      setLoading(false);
    },
    [loadFolders, loadMedia],
  );

  useEffect(() => {
    refresh(active);
  }, [refresh, active]);

  const selectFolder = (filter: FolderFilter) => {
    setLoading(true);
    setActive(filter);
  };

  const createFolder = async (name: string) => {
    const res = await fetch("/api/stock/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gagal membuat folder");
    await loadFolders();
    return data.folder as MediaFolder;
  };

  const renameFolder = async (id: string, name: string) => {
    const res = await fetch(`/api/stock/folders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gagal mengganti nama");
    await loadFolders();
  };

  const deleteFolder = async (id: string) => {
    const res = await fetch(`/api/stock/folders/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Gagal menghapus folder");
    setError(null);
    if (active === id) {
      setLoading(true);
      setActive("all");
    }
    await loadFolders();
  };

  const uploadFiles = async (files: FileList | File[], folderId: string | null) => {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      await uploadStockFiles(files, folderId, setProgress);
      await refresh(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah");
      await refresh(active);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const moveMedia = async (id: string, folderId: string | null) => {
    const res = await fetch(`/api/stock/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Gagal memindahkan");
      return;
    }
    setError(null);
    await refresh(active);
  };

  const deleteMedia = async (id: string) => {
    const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Gagal menghapus");
      return;
    }
    setError(null);
    await refresh(active);
  };

  return {
    folders,
    unfiledCount,
    totalCount,
    active,
    selectFolder,
    media,
    loading,
    uploading,
    progress,
    error,
    setError,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFiles,
    moveMedia,
    deleteMedia,
  };
}

export type StockLibrary = ReturnType<typeof useStockLibrary>;
