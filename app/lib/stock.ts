import { prisma, stockMediaCreateData, toStockMedia } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { deleteUploadedFile, saveUploadedFile, UploadError } from "@/app/lib/uploads";
import type { StockMedia } from "@/app/types";

/**
 * Simpan file + catat sebagai stock.
 * Dipakai POST /api/stock (file kecil) dan POST /upload/stock (semua ukuran).
 */
export async function createStockFromUpload(
  file: File,
  folderId: string | null,
  duration?: number,
): Promise<StockMedia> {
  if (folderId) {
    const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } });
    if (!folder) {
      throw new UploadError(404, "Folder tidak ditemukan");
    }
  }

  const asset = await saveUploadedFile(file);
  if (asset.kind !== "video" && asset.kind !== "image") {
    await deleteUploadedFile(asset.url);
    throw new UploadError(415, "Stock hanya menerima video atau gambar.");
  }

  const clampedDuration =
    asset.kind === "video" && typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? Math.min(duration, 3600)
      : undefined;

  const created: StockMedia = {
    id: newId("stock"),
    folderId: folderId ?? undefined,
    url: asset.url,
    name: asset.name,
    kind: asset.kind,
    mime: asset.mime,
    size: asset.size,
    duration: clampedDuration,
    createdAt: Date.now(),
  };

  try {
    const row = await prisma.stockMedia.create({ data: stockMediaCreateData(created) });
    return toStockMedia(row);
  } catch {
    await deleteUploadedFile(asset.url);
    throw new UploadError(409, "File sudah terdaftar di stock.");
  }
}
