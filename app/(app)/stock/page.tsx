"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Card, PageHeader } from "../../components/ui";
import { UploadProgress } from "../../components/UploadProgress";
import { useDropFiles } from "../../lib/use-drop-files";
import { useStockLibrary } from "./_hooks/useStockLibrary";
import { FolderPanel } from "./_components/FolderPanel";
import { StockGrid } from "./_components/StockGrid";

export default function StockPage() {
  const lib = useStockLibrary();
  const activeName =
    lib.active === "all"
      ? "Semua"
      : lib.active === "none"
        ? "Tanpa folder"
        : (lib.folders.find((f) => f.id === lib.active)?.name ?? "Folder");
  const uploadTarget = lib.active !== "all" && lib.active !== "none" ? lib.active : null;
  const drop = useDropFiles((files) => void lib.uploadFiles(files, uploadTarget));

  return (
    <div>
      <PageHeader
        title="Stock Media"
        subtitle="Simpan stock video & gambar per folder style, lalu pakai di Auto Post."
      />

      {lib.error && (
        <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/8 px-4 py-3 text-xs text-brand-300">
          {lib.error}
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[290px_1fr]">
        <FolderPanel
          folders={lib.folders}
          unfiledCount={lib.unfiledCount}
          totalCount={lib.totalCount}
          active={lib.active}
          onSelect={lib.selectFolder}
          onCreate={lib.createFolder}
          onRename={lib.renameFolder}
          onDelete={lib.deleteFolder}
        />

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white/85">{activeName}</h2>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {lib.media.length} file · upload baru masuk ke{" "}
                  {uploadTarget ? activeName : "Tanpa folder"}
                </p>
              </div>
            </div>
            <label
              {...drop.handlers}
              className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-xs transition ${
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
                disabled={lib.uploading}
                onChange={(e) => {
                  const files = e.target.files;
                  e.target.value = "";
                  if (files && files.length > 0) void lib.uploadFiles(files, uploadTarget);
                }}
              />
              {lib.uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Mengunggah…
                </>
              ) : (
                <>
                  {drop.dragging ? (
                    <>Lepas file untuk mengunggah</>
                  ) : (
                    <><Upload className="size-4" /> Pilih video/gambar · bisa banyak sekaligus · maks 250 MB/file</>
                  )}
                </>
              )}
            </label>
            {lib.progress !== null && <UploadProgress fraction={lib.progress} />}
          </Card>

          <StockGrid
            media={lib.media}
            folders={lib.folders}
            loading={lib.loading}
            uploading={lib.uploading}
            onOpen={(item) => window.open(item.url, "_blank", "noopener")}
            onMove={lib.moveMedia}
            onDelete={lib.deleteMedia}
          />
        </div>
      </div>
    </div>
  );
}
