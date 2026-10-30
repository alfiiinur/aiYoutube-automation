import { NextResponse } from "next/server";
import { prisma, promptSkillCreateData, toPromptSkill } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { clampDurationSec } from "@/app/lib/jobs";
import type { AspectRatio, PromptSkill } from "@/app/types";

export const dynamic = "force-dynamic";

const RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5"];

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  const rows = await prisma.promptSkill.findMany({
    where: q
      ? {
          OR: [
            { prompt: { contains: q, mode: "insensitive" } },
            { series: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ skills: rows.map(toPromptSkill) });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 8) {
    return NextResponse.json({ error: "Prompt minimal 8 karakter" }, { status: 400 });
  }

  const series = String(body.series ?? "").trim() || undefined;
  const aspectRatio = RATIOS.includes(body.aspectRatio as AspectRatio)
    ? (body.aspectRatio as AspectRatio)
    : "9:16";
  const durationSec = clampDurationSec(body.durationSec);

  // Part otomatis = lanjutan dari part terakhir di serial yang sama,
  // kecuali user mengirim angka part secara eksplisit.
  let part: number | undefined;
  if (series) {
    const explicit = Number(body.part);
    if (Number.isInteger(explicit) && explicit >= 1) {
      part = explicit;
    } else {
      const last = await prisma.promptSkill.findFirst({
        where: { series },
        orderBy: { part: "desc" },
      });
      part = (last?.part ?? 0) + 1;
    }
  }

  const now = Date.now();
  const created: PromptSkill = {
    id: newId("skill"),
    prompt,
    series,
    part,
    aspectRatio,
    durationSec,
    style: String(body.style ?? "cinematic"),
    voice: String(body.voice ?? "female-id"),
    model: String(body.model ?? "studio-v1"),
    useCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const row = await prisma.promptSkill.create({ data: promptSkillCreateData(created) });
  return NextResponse.json({ skill: toPromptSkill(row) }, { status: 201 });
}
