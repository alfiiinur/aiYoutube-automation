import { NextResponse } from "next/server";
import { mutate } from "@/app/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const job = await mutate((db) => {
    const j = db.jobs.find((x) => x.id === id);
    if (!j) return null;
    const now = Date.now();
    j.status = "queued";
    j.progress = 1;
    j.createdAt = now;
    j.updatedAt = now;
    j.logs = [{ at: now, message: "Render diulang dari awal" }];
    delete j.error;
    return j;
  });
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ job });
}