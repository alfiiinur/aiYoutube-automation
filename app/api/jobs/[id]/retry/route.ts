import { NextResponse } from "next/server";
import { prisma, jsonValue, toVideoJob } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const now = Date.now();

  const { count } = await prisma.videoJob.updateMany({
    where: { id },
    data: {
      status: "queued",
      progress: 1,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      logs: jsonValue([{ at: now, message: "Render diulang dari awal" }]),
      error: null,
    },
  });

  if (count === 0) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const row = await prisma.videoJob.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({ job: toVideoJob(row) });
}
