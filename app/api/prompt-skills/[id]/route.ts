import { NextResponse } from "next/server";
import { prisma, toPromptSkill } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "used") {
    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  }

  const { count } = await prisma.promptSkill.updateMany({
    where: { id },
    data: { useCount: { increment: 1 } },
  });
  if (count === 0) return NextResponse.json({ error: "Skill tidak ditemukan" }, { status: 404 });

  const row = await prisma.promptSkill.findUnique({ where: { id } });
  return NextResponse.json({ skill: row ? toPromptSkill(row) : null });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const { count } = await prisma.promptSkill.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Skill tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
