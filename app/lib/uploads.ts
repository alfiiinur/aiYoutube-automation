import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { EditorMedia, EditorMediaKind } from "@/app/types";
import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "./upload-limits";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export { MAX_UPLOAD_BYTES };

const EXT_KIND: Record<string, EditorMediaKind> = {
  mp4: "video",
  m4v: "video",
  mov: "video",
  webm: "video",
  mkv: "video",
  avi: "video",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  aac: "audio",
  ogg: "audio",
  flac: "audio",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  avif: "image",
};

const MIME_FALLBACK: Record<EditorMediaKind, string> = {
  video: "video/mp4",
  audio: "audio/mpeg",
  image: "image/png",
};

function kindOf(name: string, mime: string): EditorMediaKind | null {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";

  const ext = path.extname(name).slice(1).toLowerCase();
  return EXT_KIND[ext] ?? null;
}

function extensionOf(name: string, mime: string, kind: EditorMediaKind): string {
  const ext = path.extname(name).slice(1).toLowerCase();
  if (EXT_KIND[ext] === kind) return `.${ext}`;
  if (kind === "image") return mime === "image/jpeg" ? ".jpg" : ".png";
  if (kind === "audio") return mime === "audio/mp4" ? ".m4a" : ".mp3";
  return mime === "video/webm" ? ".webm" : ".mp4";
}

export class UploadError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Simpan file upload ke data/uploads. Dipakai /api/uploads dan /api/stock. */
export async function saveUploadedFile(file: File): Promise<EditorMedia> {
  if (file.size <= 0) {
    throw new UploadError(400, "File kosong");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(413, `Ukuran file maksimal ${MAX_UPLOAD_LABEL}`);
  }

  const mime = file.type || "";
  const kind = kindOf(file.name, mime);
  if (!kind) {
    throw new UploadError(
      415,
      "Format tidak didukung. Gunakan video, gambar, atau audio (MP4/MP3/PNG/JPG).",
    );
  }

  const ext = extensionOf(file.name, mime, kind);
  const storedName = `${randomUUID()}${ext}`;
  const resolvedMime = mime || MIME_FALLBACK[kind];

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  } catch {
    throw new UploadError(500, "Gagal menyimpan file di server");
  }

  return {
    url: `/api/uploads/${storedName}?type=${encodeURIComponent(resolvedMime)}`,
    name: (file.name || storedName).slice(0, 160),
    kind,
    mime: resolvedMime,
    size: file.size,
  };
}

const STORED_NAME_RE = /^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i;

/**
 * Hapus file upload dari disk (best-effort: false kalau nama tidak valid
 * atau file sudah tidak ada).
 */
export async function deleteUploadedFile(url: string): Promise<boolean> {
  const name = url.split("?")[0].split("/").pop() ?? "";
  if (!STORED_NAME_RE.test(name)) return false;
  try {
    await fs.unlink(path.join(UPLOAD_DIR, name));
    return true;
  } catch {
    return false;
  }
}

/**
 * Tolak bodi raksasa sebelum dibaca (hemat RAM & waktu; cegah OOM).
 * Kembalikan respons 413 atau null bila ukuran wajar.
 */
export function rejectOversizedBody(req: Request): NextResponse | null {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(len) && len > MAX_UPLOAD_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: `Ukuran file maksimal ${MAX_UPLOAD_LABEL}` }, { status: 413 });
  }
  return null;
}
