import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const { count } = await prisma.referenceSource.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Referensi tidak ditemukan" }, { status: 404 });

  // Detach from any job that referenced it.
  await prisma.$executeRaw`
    UPDATE "VideoJob"
    SET "referenceIds" = array_remove("referenceIds", ${id})
    WHERE ${id} = ANY("referenceIds")
  `;

  return NextResponse.json({ ok: true });
}
