import { NextResponse } from "next/server";
import { prisma, jsonValue, toReference, toVideoJob } from "@/app/lib/db";
import { evolve } from "@/app/lib/store";
import { notifyJobReady } from "@/app/lib/telegram";
import type { VideoJob } from "@/app/types";
import { isThumbnailTemplate } from "@/app/lib/thumbnail-templates";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = ["queued", "analyzing", "scripting", "rendering", "ready", "failed"];

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await prisma.videoJob.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const job = evolve(toVideoJob(row));
  const referenceRows = job.referenceIds.length
    ? await prisma.referenceSource.findMany({ where: { id: { in: job.referenceIds } } })
    : [];
  return NextResponse.json({ job, references: referenceRows.map(toReference) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; thumbnailTemplate?: string };
  const wantStatus = typeof body.status === "string" ? body.status : undefined;
  const wantTemplate = typeof body.thumbnailTemplate === "string" ? body.thumbnailTemplate : undefined;
  if (wantStatus !== undefined && !ALLOWED.includes(wantStatus)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }
  if (wantTemplate !== undefined && !isThumbnailTemplate(wantTemplate)) {
    return NextResponse.json({ error: "Template thumbnail tidak valid" }, { status: 400 });
  }
  if (wantStatus === undefined && wantTemplate === undefined) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const row = await prisma.videoJob.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const nextStatus = (wantStatus ?? row.status) as VideoJob["status"];
  const now = Date.now();
  const logs =
    wantStatus !== undefined
      ? [
          ...((row.logs ?? []) as unknown as VideoJob["logs"]),
          { at: now, message: `Status diubah manual → ${nextStatus}` },
        ]
      : ((row.logs ?? []) as unknown as VideoJob["logs"]);

  const updated = await prisma.videoJob.update({
    where: { id },
    data: {
      status: nextStatus,
      progress: nextStatus === "ready" ? 100 : nextStatus === "queued" ? 1 : row.progress,
      logs: jsonValue(logs),
      error: nextStatus === "failed" ? "Gagal ditandai manual" : null,
      ...(wantTemplate !== undefined ? { thumbnailTemplate: wantTemplate } : {}),
      updatedAt: new Date(now),
    },
  });

  const job = toVideoJob(updated);
  if (wantStatus === "ready") await notifyJobReady(job);
  return NextResponse.json({ job });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { count } = await prisma.videoJob.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
