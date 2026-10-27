import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const NAME_RE = /^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i;

const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  aac: "audio/aac",
  ogg: "audio/ogg",
  flac: "audio/flac",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

type Ctx = { params: Promise<{ file: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { file } = await params;
  if (!NAME_RE.test(file)) {
    return NextResponse.json({ error: "Nama file tidak valid" }, { status: 400 });
  }

  const fullPath = path.join(UPLOAD_DIR, file);
  let data: Buffer;
  try {
    data = await fs.readFile(fullPath);
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  const ext = path.extname(file).slice(1).toLowerCase();
  const requested = new URL(req.url).searchParams.get("type") ?? "";
  const contentType = /^(video|audio|image)\/[\w.+-]+$/i.test(requested)
    ? requested
    : (MIME_BY_EXT[ext] ?? "application/octet-stream");

  const headers: Record<string, string> = {
    "content-type": contentType,
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
    "content-disposition": `inline; filename="${file}"`,
  };

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), data.length - 1) : data.length - 1;
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < data.length) {
        const chunk = data.subarray(start, end + 1);
        return new Response(new Uint8Array(chunk), {
          status: 206,
          headers: {
            ...headers,
            "content-range": `bytes ${start}-${end}/${data.length}`,
            "content-length": String(chunk.length),
          },
        });
      }
    }
    return new Response(null, {
      status: 416,
      headers: { ...headers, "content-range": `bytes */${data.length}` },
    });
  }

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: { ...headers, "content-length": String(data.length) },
  });
}
