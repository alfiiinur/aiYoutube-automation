import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { count } = await prisma.promptHistory.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Riwayat tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
