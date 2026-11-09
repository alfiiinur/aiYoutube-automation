import { NextResponse } from "next/server";
import { rejectOversizedBody, saveUploadedFile, UploadError } from "@/app/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upload file generik TANPA middleware.
 *
 * PENTING: jangan pindahkan ke /api/* — request yang lewat middleware
 * terpotong di 10 MiB (bodi yang diterima route handler tidak utuh)
 * sehingga file besar gagal dengan "Failed to parse body as FormData".
 * Path ini sengaja di luar matcher middleware agar upload sampai 250 MB
 * lolos utuh.
 *
 * Publik seperti POST /api/uploads (aset GET-nya memang publik).
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
