import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { count } = await prisma.scheduleNote.deleteMany({ where: { id } });
  if (count === 0) {
    return NextResponse.json({ error: "Note tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
