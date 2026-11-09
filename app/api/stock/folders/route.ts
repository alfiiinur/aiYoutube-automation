import { NextResponse } from "next/server";
import { prisma, mediaFolderCreateData, toMediaFolder } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import type { MediaFolder } from "@/app/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.mediaFolder.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { media: true } } },
  });
  const [unfiledCount, totalCount] = await Promise.all([
    prisma.stockMedia.count({ where: { folderId: null } }),
    prisma.stockMedia.count(),
  ]);
  return NextResponse.json({
    folders: rows.map((r) => toMediaFolder(r, r._count.media)),
    unfiledCount,
    totalCount,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: unknown };
  const name = String(body.name ?? "").trim().slice(0, 60);
  if (!name) {
    return NextResponse.json({ error: "Nama folder wajib diisi" }, { status: 400 });
  }

  const created: MediaFolder = { id: newId("folder"), name, createdAt: Date.now() };
  const row = await prisma.mediaFolder.create({ data: mediaFolderCreateData(created) });
  return NextResponse.json({ folder: toMediaFolder(row, 0) }, { status: 201 });
}
