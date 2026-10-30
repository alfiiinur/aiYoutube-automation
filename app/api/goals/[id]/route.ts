import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "complete" && body.action !== "reopen") {
    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  }

  const { count } = await prisma.goal.updateMany({
    where: { id },
    data: {
      completedAt: body.action === "complete" ? new Date() : null,
      updatedAt: new Date(),
    },
  });
  if (count === 0) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const { count } = await prisma.goal.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
