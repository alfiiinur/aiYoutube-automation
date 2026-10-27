import { NextResponse } from "next/server";
import { mutate } from "@/app/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await mutate((db) => {
    const i = db.references.findIndex((r) => r.id === id);
    if (i === -1) return false;
    db.references.splice(i, 1);
    // Detach from any job that referenced it.
    for (const job of db.jobs) {
      job.referenceIds = job.referenceIds.filter((rid) => rid !== id);
    }
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Referensi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}