import { NextResponse } from "next/server";
import { createJob, syncJobs } from "@/app/lib/jobs";
import type { AspectRatio } from "@/app/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await syncJobs();
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

  const job = await createJob({
    prompt,
    referenceIds,
    aspectRatio,
    durationSec: Number(body.durationSec ?? 45),
    style: String(body.style ?? "cinematic"),
    voice: String(body.voice ?? "female-id"),
    model: String(body.model ?? "studio-v1"),
  });

  return NextResponse.json({ job }, { status: 201 });
}
