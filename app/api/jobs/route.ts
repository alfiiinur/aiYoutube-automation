import { NextResponse } from "next/server";
import { getDb, mutate, newId } from "@/app/lib/store";
import { generateJobContent } from "@/app/lib/generator";
import type { AspectRatio, VideoJob } from "@/app/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const jobs = [...db.jobs].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ jobs });
}

const RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5"];

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

  const referenceIds = Array.isArray(body.referenceIds) ? body.referenceIds.map(String) : [];
  const aspectRatio = RATIOS.includes(body.aspectRatio as AspectRatio)
    ? (body.aspectRatio as AspectRatio)
    : "9:16";
  const durationSec = Math.max(10, Math.min(180, Number(body.durationSec ?? 45)));
  const style = String(body.style ?? "cinematic");
  const voice = String(body.voice ?? "female-id");
  const model = String(body.model ?? "studio-v1");

  const job = await mutate((db) => {
    const references = db.references.filter((r) => referenceIds.includes(r.id));
    const content = generateJobContent({
      prompt,
      references,
      style,
      voice,
      durationSec,
      aspectRatio,
      model,
    });

    const now = Date.now();
    const created: VideoJob = {
      id: newId("job"),
      prompt,
      referenceIds,
      aspectRatio,
      durationSec,
      style,
      voice,
      model,
      status: "analyzing",
      progress: 2,
      createdAt: now,
      updatedAt: now,
      ...content,
      logs: [{ at: now, message: "Job dibuat, masuk antrean render" }],
    };
    db.jobs.unshift(created);
    return created;
  });

  return NextResponse.json({ job }, { status: 201 });
}