"use client";

import { useState } from "react";
import { Folder, FolderOpen, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "../../../components/ui";
import type { MediaFolder } from "../../../types";
import type { FolderFilter } from "../_hooks/useStockLibrary";

export function FolderPanel({
  folders,
  unfiledCount,
  totalCount,
  active,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  folders: MediaFolder[];
  unfiledCount: number;
  totalCount: number;
  active: FolderFilter;
  onSelect: (filter: FolderFilter) => void;
  onCreate: (name: string) => Promise<unknown>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setFormError(null);
    try {
      await onCreate(name.trim());
      setName("");
      setCreating(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat folder");
    } finally {
      setBusy(false);
    }
  };

  const submitRename = async (id: string) => {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await onRename(id, editValue.trim());
      setEditingId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal mengganti nama");
    }
  };

  const rowClass = (isActive: boolean) =>
    `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
      isActive ? "bg-white font-medium text-black" : "text-white/60 hover:bg-white/5 hover:text-white/90"
    }`;

  const countClass = (isActive: boolean) =>
    `rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-black/10 text-black/70" : "bg-white/8 text-white/40"}`;

  return (
    <Card className="h-fit p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/85">Folder</h2>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setFormError(null);
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/50 transition hover:bg-white/8 hover:text-white"
        >
          <Plus className="size-3.5" /> Baru
        </button>
      </div>

      {creating && (
        <form onSubmit={submitCreate} className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: cinematic, horror…"
            maxLength={60}
            autoFocus
            className="input-base"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            Buat
          </button>
        </form>
      )}
      {formError && <p className="mt-2 text-[11px] text-brand-400">{formError}</p>}

      <div className="mt-3 flex flex-col gap-1">
        <button type="button" onClick={() => onSelect("all")} className={rowClass(active === "all")}>
          <Layers className="size-4 shrink-0" />
          <span className="flex-1 text-left">Semua</span>
          <span className={countClass(active === "all")}>{totalCount}</span>
        </button>
        <button type="button" onClick={() => onSelect("none")} className={rowClass(active === "none")}>
          <FolderOpen className="size-4 shrink-0" />
          <span className="flex-1 text-left">Tanpa folder</span>
          <span className={countClass(active === "none")}>{unfiledCount}</span>
        </button>

        {folders.map((f) => {
          const isActive = active === f.id;
          const editing = editingId === f.id;
          return (
            <div key={f.id} className="flex items-center gap-1">
              {editing ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitRename(f.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => setEditingId(null)}
                  maxLength={60}
                  autoFocus
                  className="input-base"
                />
              ) : (
                <>
                  <button type="button" onClick={() => onSelect(f.id)} className={`${rowClass(isActive)} min-w-0 flex-1`}>
                    <Folder className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{f.name}</span>
                    <span className={countClass(isActive)}>{f.mediaCount ?? 0}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditValue(f.name);
                      setEditingId(f.id);
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/70"
                    aria-label={`Ganti nama ${f.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Hapus folder "${f.name}" beserta ${f.mediaCount ?? 0} file di dalamnya?`,
                        )
                      ) {
                        onDelete(f.id).catch((err: unknown) =>
                          setFormError(err instanceof Error ? err.message : "Gagal menghapus folder"),
                        );
                      }
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-brand-400"
                    aria-label={`Hapus folder ${f.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
