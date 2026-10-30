import { NextResponse } from "next/server";
import { jsonValue, prisma, toPromptHistory } from "@/app/lib/db";
import { newId } from "@/app/lib/store";

export const dynamic = "force-dynamic";

const MAX_ENTRIES = 20;

export async function GET() {
  const rows = await prisma.promptHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ENTRIES,
  });
  return NextResponse.json({ entries: rows.map(toPromptHistory) });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim().replace(/\s+/g, " ");
  if (topic.length < 3 || topic.length > 200) {
    return NextResponse.json({ error: "Topik 3–200 karakter" }, { status: 400 });
  }
  const rawIdeas = Array.isArray(body.ideas) ? body.ideas : [];
  const ideas = rawIdeas.flatMap((e) => {
    if (!e || typeof e !== "object") return [];
    const item = e as { title?: unknown; prompt?: unknown; angle?: unknown };
    const title = String(item.title ?? "").trim().slice(0, 120);
    const prompt = String(item.prompt ?? "").trim().slice(0, 1500);
    if (title.length < 3 || prompt.length < 20) return [];
    const angle = String(item.angle ?? "").trim().slice(0, 40);
    return [{ title, prompt, ...(angle ? { angle } : {}) }];
  });
  if (ideas.length === 0 || ideas.length > 8) {
    return NextResponse.json({ error: "Ide 1–8 item valid" }, { status: 400 });
  }

  const row = await prisma.promptHistory.create({
    data: {
      id: newId("ph"),
      topic: topic.slice(0, 200),
      count: ideas.length,
      ideas: jsonValue(ideas),
      source: body.source === "ai" ? "ai" : "local",
      notice: String(body.notice ?? "").trim().slice(0, 500) || null,
    },
  });

  // Pangkas riwayat lama di luar 20 terbaru.
  const keep = await prisma.promptHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ENTRIES,
    select: { id: true },
  });
  await prisma.promptHistory.deleteMany({ where: { id: { notIn: keep.map((k) => k.id) } } });

  return NextResponse.json({ entry: toPromptHistory(row) }, { status: 201 });
}
