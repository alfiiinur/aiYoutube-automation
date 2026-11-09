import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionSecret, verifySessionValue } from "@/app/lib/session";
import { createStockFromUpload } from "@/app/lib/stock";
import { rejectOversizedBody, UploadError } from "@/app/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upload stock TANPA middleware (lihat penjelasan 10 MiB di app/upload/route.ts).
 * Auth dicek di sini karena middleware tidak berjalan untuk path ini —
 * logikanya sama persis dengan middleware (cookie sesi HMAC).
 */
export async function POST(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const uid = token ? await verifySessionValue(token, sessionSecret()) : null;
  if (!uid) {
    return NextResponse.json({ error: "Belum masuk. Silakan login." }, { status: 401 });
  }

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
