"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { MediaTile } from "../../../components/MediaTile";
import { UploadProgress } from "../../../components/UploadProgress";
import { useDropFiles } from "../../../lib/use-drop-files";
import { uploadStockFiles } from "../../../lib/stock-upload";
import type { MediaFolder, StockMedia } from "../../../types";

export function StockPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: StockMedia) => void;
}) {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [filter, setFilter] = useState("all");
  const [media, setMedia] = useState<StockMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const uploadTarget = filter !== "all" && filter !== "none" ? filter : null;
  const activeFolder = folders.find((f) => f.id === filter);
  const targetName =
    filter === "all" || filter === "none" ? "Tanpa folder" : (activeFolder?.name ?? "folder ini");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const mediaUrl =
        filter === "all" ? "/api/stock" : `/api/stock?folderId=${filter === "none" ? "none" : filter}`;
      const [f, m] = await Promise.all([
        fetch("/api/stock/folders", { cache: "no-store" }).then((x) => x.json()),
        fetch(mediaUrl, { cache: "no-store" }).then((x) => x.json()),
      ]);
      if (!alive) return;
      setFolders(f.folders ?? []);
      setMedia(m.media ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [open, filter, refreshKey]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/stock/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat folder");
      const folder = data.folder as MediaFolder;
      setFolders((prev) => [...prev, folder]);
      setFilter(folder.id);
      setNewName("");
      setCreating(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat folder");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!activeFolder) return;
    if (!window.confirm(`Hapus folder "${activeFolder.name}" beserta seluruh isinya?`)) return;
    setFormError(null);
    try {
      const res = await fetch(`/api/stock/folders/${activeFolder.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus folder");
      setFolders((prev) => prev.filter((f) => f.id !== activeFolder.id));
      setFilter("all");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus folder");
    }
  };

  const handleMoveMedia = async (id: string, folderId: string | null) => {
    setFormError(null);
    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal memindahkan");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal memindahkan");
    }
  };

  const handleDeleteMedia = async (id: string) => {
    setFormError(null);
    try {
      const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress(0);
    setFormError(null);
    try {
      const { skipped } = await uploadStockFiles(files, uploadTarget, setProgress);
      if (skipped.length > 0) {
        setFormError(`${skipped.length} file dilewati (bukan video/gambar).`);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mengunggah");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const drop = useDropFiles((files) => void handleUpload(files));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/12 bg-ink-900 p-5 shadow-2xl shadow-black/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Pilih dari Stock</h3>
            <p className="mt-1 text-[11px] text-white/40">Klik salah satu untuk dipakai di postingan ini.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex max-w-md items-end gap-2">
          <div className="min-w-0 flex-1">
            <label className="text-[11px] text-white/45">Folder</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-base mt-1.5"
            >
              <option value="all" className="bg-ink-900">Semua</option>
              <option value="none" className="bg-ink-900">Tanpa folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-ink-900">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreating((v) => !v);
              setFormError(null);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-xs text-white/70 transition hover:bg-white/8 hover:text-white"
          >
            <Plus className="size-3.5" /> Folder
          </button>
          {activeFolder && (
            <button
              type="button"
              onClick={() => void handleDeleteFolder()}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/4 text-white/40 transition hover:bg-white/8 hover:text-brand-400"
              aria-label={`Hapus folder ${activeFolder.name}`}
              title={`Hapus folder ${activeFolder.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        {creating && (
          <form onSubmit={submitCreate} className="mt-2 flex max-w-md gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="cth: cinematic, horror…"
              maxLength={60}
              autoFocus
              className="input-base"
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
            >
              Buat
            </button>
          </form>
        )}

        <label
          {...drop.handlers}
          className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3.5 text-xs transition ${
            drop.dragging
              ? "border-white/50 bg-white/8 text-white/85"
              : "border-white/15 bg-white/3 text-white/45 hover:border-white/30 hover:text-white/70"
          }`}
        >
          <input
            type="file"
            accept="video/*,image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const files = e.target.files;
              e.target.value = "";
              void handleUpload(files);
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Mengunggah ke {targetName}…
            </>
          ) : (
            <>
              {drop.dragging ? (
                <>Lepas file untuk mengunggah</>
              ) : (
                <><Upload className="size-4" /> Upload ke {targetName} · bisa banyak sekaligus</>
              )}
            </>
          )}
        </label>
        {progress !== null && <UploadProgress fraction={progress} />}
        {formError && <p className="mt-2 text-[11px] text-brand-400">{formError}</p>}

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/4" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-xs text-white/40">
              Belum ada stock di sini. Upload lewat kotak di atas.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((m) => (
                <MediaTile
                  key={m.id}
                  item={m}
                  folders={folders}
                  onSelect={() => {
                    onPick(m);
                    onClose();
                  }}
                  onMove={(id, folderId) => void handleMoveMedia(id, folderId)}
                  onDelete={(id) => void handleDeleteMedia(id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
