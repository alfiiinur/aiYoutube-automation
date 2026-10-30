import { NextResponse } from "next/server";
import { prisma, scheduleNoteCreateData, toScheduleNote } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { NOTE_COLOR_IDS, type NoteColor, type ScheduleNote } from "@/app/types";

export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDay(day: string): boolean {
  if (!DAY_RE.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export async function GET() {
  const rows = await prisma.scheduleNote.findMany({
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ notes: rows.map(toScheduleNote) });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const day = String(body.day ?? "").trim();
  if (!isValidDay(day)) {
    return NextResponse.json({ error: "Tanggal tidak valid (pakai format YYYY-MM-DD)" }, { status: 400 });
  }

  const text = String(body.text ?? "").trim();
  if (text.length < 1) {
    return NextResponse.json({ error: "Isi note dulu" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "Note maksimal 500 karakter" }, { status: 400 });
  }

  const color = NOTE_COLOR_IDS.includes(body.color as NoteColor)
    ? (body.color as NoteColor)
    : "yellow";

  const created: ScheduleNote = {
    id: newId("note"),
    day,
    text,
    color,
    createdAt: Date.now(),
  };

  const row = await prisma.scheduleNote.create({ data: scheduleNoteCreateData(created) });
  return NextResponse.json({ note: toScheduleNote(row) }, { status: 201 });
}
