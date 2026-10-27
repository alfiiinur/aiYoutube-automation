import { NextResponse } from "next/server";
import { mutate } from "@/app/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean; runNow?: boolean };

  const updated = await mutate((db) => {
    const a = db.automations.find((x) => x.id === id);
    if (!a) return null;
    if (typeof body.enabled === "boolean") a.enabled = body.enabled;
    if (body.runNow) {
      a.lastRunAt = Date.now();
      a.runs += 1;
      const d = new Date(Date.now() + 24 * 3600_000);
      a.nextRunAt = d.getTime();
    }
    return a;
  });

  if (!updated) return NextResponse.json({ error: "Automation tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ automation: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await mutate((db) => {
    const i = db.automations.findIndex((a) => a.id === id);
    if (i === -1) return false;
    db.automations.splice(i, 1);
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Automation tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}