import { NextResponse } from "next/server";
import { prisma, jsonValue } from "@/app/lib/db";
import { sanitizeSnapshot, sanitizeTranscript, toGoalChat } from "@/app/lib/goal-chats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    snapshot?: unknown;
    transcript?: unknown;
    goalId?: unknown;
  };

  const row = await prisma.goalChat.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Chat tidak ditemukan" }, { status: 404 });

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) {
    const title = String(body.title).trim().slice(0, 120);
    if (title) data.title = title;
  }
  if (body.snapshot !== undefined) data.snapshot = jsonValue(sanitizeSnapshot(body.snapshot));
  if (body.transcript !== undefined) data.transcript = jsonValue(sanitizeTranscript(body.transcript));
  if (body.goalId !== undefined) {
    data.goalId = typeof body.goalId === "string" && body.goalId ? body.goalId.slice(0, 80) : null;
  }

  const updated = await prisma.goalChat.update({ where: { id }, data });
  return NextResponse.json({ chat: toGoalChat(updated) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { count } = await prisma.goalChat.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Chat tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
