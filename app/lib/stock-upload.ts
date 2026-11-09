import type { StockMedia } from "@/app/types";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "./upload-limits";
import { isSupportedMediaFile, probeMediaDuration } from "./media";

function postFormData(
  url: string,
  body: FormData,
  onItemProgress?: (loaded: number, total: number) => void,
): Promise<{ stock: StockMedia }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    if (onItemProgress) {
      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable && e.total > 0) onItemProgress(e.loaded, e.total);
      };
    }
    xhr.onload = () => {
      const data = (xhr.response ?? {}) as { stock?: StockMedia; error?: string };
      if (xhr.status >= 200 && xhr.status < 300 && data.stock) resolve({ stock: data.stock });
      else reject(new Error(data.error ?? `Upload gagal (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload gagal: jaringan terputus"));
    xhr.ontimeout = () => reject(new Error("Upload gagal: waktu habis"));
    xhr.send(body);
  });
}

/**
 * Upload satu/lebih file stock (dipakai halaman Stock, picker & composer).
 * onProgress dipanggil dengan fraksi 0..1 dari total byte. XHR dipakai
 * karena fetch tidak memberi progres upload.
 */
export async function uploadStockFiles(
  files: FileList | File[],
  folderId: string | null,
  onProgress?: (fraction: number) => void,
): Promise<{ uploaded: StockMedia[]; skipped: string[] }> {
  const list = Array.from(files);
  const picked = list.filter((f) => isSupportedMediaFile(f) && !f.type.startsWith("audio/"));
  const skipped = list.filter((f) => !picked.includes(f)).map((f) => f.name);
  if (picked.length === 0) {
    throw new Error("Pilih video atau gambar (MP4/MOV/PNG/JPG).");
  }
  const oversized = picked.filter((f) => f.size > MAX_UPLOAD_BYTES);
  if (oversized.length > 0) {
    const names = oversized.map((f) => `"${f.name}"`).join(", ");
    throw new Error(`${names} melebihi ${MAX_UPLOAD_LABEL}. Kecilkan/kompres dulu.`);
  }

  const totalSize = picked.reduce((n, f) => n + (f.size || 0), 0) || 1;
  let doneSize = 0;
  onProgress?.(0);
  const uploaded: StockMedia[] = [];
  for (const file of picked) {
    const duration = file.type.startsWith("video/") ? await probeMediaDuration(file) : undefined;
    const body = new FormData();
    body.append("file", file);
    if (folderId) body.append("folderId", folderId);
    if (duration !== undefined) body.append("duration", String(duration));
    const size = file.size || 0;
    const { stock } = await postFormData("/upload/stock", body, (loaded, total) => {
      onProgress?.(Math.min(1, (doneSize + (loaded / total) * size) / totalSize));
    });
    uploaded.push(stock);
    doneSize += size;
    onProgress?.(Math.min(1, doneSize / totalSize));
  }
  return { uploaded, skipped };
}
