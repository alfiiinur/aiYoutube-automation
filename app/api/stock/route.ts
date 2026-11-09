import { NextResponse } from "next/server";
import { prisma, toStockMedia } from "@/app/lib/db";
import { createStockFromUpload } from "@/app/lib/stock";
import { rejectOversizedBody, UploadError } from "@/app/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daftar stock. ?folderId=<id> untuk satu folder, ?folderId=none untuk tanpa folder. */
export async function GET(req: Request) {
  const folderId = new URL(req.url).searchParams.get("folderId");
  const rows = await prisma.stockMedia.findMany({
    where: folderId === null ? {} : folderId === "none" ? { folderId: null } : { folderId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ media: rows.map(toStockMedia) });
}

/**
 * Upload stock baru (multipart: file, folderId opsional, duration opsional).
 * Catatan: request lewat middleware terpotong di 10 MiB — klien memakai
 * POST /upload/stock untuk file besar; endpoint ini tetap untuk kompatibilitas.
 */
export async function POST(req: Request) {
  const oversized = rejectOversizedBody(req);
  if (oversized) return oversized;
  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return NextResponse.json(
      {
        error: "Gagal membaca file upload",
        ...(process.env.NODE_ENV === "production"
          ? {}
          : { detail: e instanceof Error ? e.message : String(e) }),
      },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  const rawFolder = form.get("folderId");
  const folderId = typeof rawFolder === "string" && rawFolder.trim() ? rawFolder.trim() : null;

  try {
    const stock = await createStockFromUpload(file, folderId, Number(form.get("duration")));
    return NextResponse.json({ stock }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
