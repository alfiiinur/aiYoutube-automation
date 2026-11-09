import { NextResponse } from "next/server";
import { prisma, toMediaFolder } from "@/app/lib/db";
import { deleteUploadedFile } from "@/app/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { name?: unknown };
  const name = String(body.name ?? "").trim().slice(0, 60);
  if (!name) {
    return NextResponse.json({ error: "Nama folder wajib diisi" }, { status: 400 });
  }

  const row = await prisma.mediaFolder.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
  }
  const updated = await prisma.mediaFolder.update({ where: { id }, data: { name } });
  const mediaCount = await prisma.stockMedia.count({ where: { folderId: id } });
  return NextResponse.json({ folder: toMediaFolder(updated, mediaCount) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await prisma.mediaFolder.findUnique({
    where: { id },
    include: { media: { select: { id: true, url: true } } },
  });
  if (!row) {
    return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
  }

  const used = await prisma.socialPost.findFirst({
    where: { mediaUrl: { in: row.media.map((m) => m.url) }, status: "scheduled" },
    select: { id: true },
  });
  if (used) {
    return NextResponse.json(
      { error: "Ada file di folder ini yang dipakai postingan terjadwal." },
      { status: 409 },
    );
  }

  await prisma.mediaFolder.delete({ where: { id } });
  await Promise.all(row.media.map((m) => deleteUploadedFile(m.url)));
  return NextResponse.json({ ok: true, deletedFiles: row.media.length });
}
