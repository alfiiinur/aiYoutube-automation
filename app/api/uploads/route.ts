import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { EditorMedia, EditorMediaKind } from "@/app/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 250 * 1024 * 1024;

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

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Gagal membaca file upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: "File kosong" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 250 MB" }, { status: 413 });
  }

  const mime = file.type || "";
  const kind = kindOf(file.name, mime);
  if (!kind) {
    return NextResponse.json(
      { error: "Format tidak didukung. Gunakan video, gambar, atau audio (MP4/MP3/PNG/JPG)." },
      { status: 415 },
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
    return NextResponse.json({ error: "Gagal menyimpan file di server" }, { status: 500 });
  }

  const asset: EditorMedia = {
    url: `/api/uploads/${storedName}?type=${encodeURIComponent(resolvedMime)}`,
    name: (file.name || storedName).slice(0, 160),
    kind,
    mime: resolvedMime,
    size: file.size,
  };

  return NextResponse.json({ asset });
}
