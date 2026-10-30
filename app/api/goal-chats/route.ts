import { NextResponse } from "next/server";
import { prisma, jsonValue } from "@/app/lib/db";
import { sanitizeSnapshot, sanitizeTranscript, toGoalChat } from "@/app/lib/goal-chats";
import { newId } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.goalChat.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ chats: rows.map(toGoalChat) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    snapshot?: unknown;
    transcript?: unknown;
  };

  const transcript = sanitizeTranscript(body.transcript);
  if (transcript.length === 0) {
    return NextResponse.json({ error: "Transkrip kosong" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim().slice(0, 120) || "Percakapan baru";
  const now = Date.now();
  const row = await prisma.goalChat.create({
    data: {
      id: newId("gchat"),
      title,
      snapshot: jsonValue(sanitizeSnapshot(body.snapshot)),
      transcript: jsonValue(transcript),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    },
  });
  return NextResponse.json({ chat: toGoalChat(row) }, { status: 201 });
}
