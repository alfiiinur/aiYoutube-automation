import { NextResponse } from "next/server";
import { prisma, toStockMedia } from "@/app/lib/db";
import { deleteUploadedFile } from "@/app/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { folderId?: unknown };

  const row = await prisma.stockMedia.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Stock tidak ditemukan" }, { status: 404 });
  }

  const raw = body.folderId;
  const folderId = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  if (folderId) {
    const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }
  }

  const updated = await prisma.stockMedia.update({ where: { id }, data: { folderId } });
  return NextResponse.json({ stock: toStockMedia(updated) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await prisma.stockMedia.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Stock tidak ditemukan" }, { status: 404 });
  }

  const used = await prisma.socialPost.findFirst({
    where: { mediaUrl: row.url, status: "scheduled" },
    select: { id: true },
  });
  if (used) {
    return NextResponse.json(
      { error: "File dipakai postingan terjadwal. Hapus/geser jadwalnya dulu." },
      { status: 409 },
    );
  }

  await prisma.stockMedia.delete({ where: { id } });
  await deleteUploadedFile(row.url);
  return NextResponse.json({ ok: true });
}
