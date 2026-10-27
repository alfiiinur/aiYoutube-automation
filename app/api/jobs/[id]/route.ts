import { NextResponse } from "next/server";
import { getDb, mutate } from "@/app/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = ["queued", "analyzing", "scripting", "rendering", "ready", "failed"];

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = await getDb();
  const job = db.jobs.find((j) => j.id === id);
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  const references = db.references.filter((r) => job.referenceIds.includes(r.id));
  return NextResponse.json({ job, references });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const updated = await mutate((db) => {
    const job = db.jobs.find((j) => j.id === id);
    if (!job) return null;
    job.status = body.status as (typeof job)["status"];
    job.progress = body.status === "ready" ? 100 : body.status === "queued" ? 1 : job.progress;
    job.updatedAt = Date.now();
    job.logs.push({ at: Date.now(), message: `Status diubah manual → ${body.status}` });
    if (body.status === "failed") job.error = "Gagal ditandai manual";
    else if (body.status === "ready") delete job.error;
    return job;
  });

  if (!updated) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ job: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const removed = await mutate((db) => {
    const i = db.jobs.findIndex((j) => j.id === id);
    if (i === -1) return false;
    db.jobs.splice(i, 1);
    return true;
  });
  if (!removed) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}