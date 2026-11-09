import { NextResponse } from "next/server";
import { rejectOversizedBody, saveUploadedFile, UploadError } from "@/app/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Catatan: request lewat middleware terpotong di 10 MiB — klien memakai
// POST /upload untuk file besar; endpoint ini tetap untuk kompatibilitas.
export async function POST(req: Request) {
  const oversized = rejectOversizedBody(req);
  if (oversized) return oversized;
  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    console.error("POST /api/uploads formData gagal:", e);
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

  try {
    const asset = await saveUploadedFile(file);
    return NextResponse.json({ asset });
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
