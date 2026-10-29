import { NextResponse } from "next/server";
import { prisma, toAutomation } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean; runNow?: boolean };

  const row = await prisma.automation.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Automation tidak ditemukan" }, { status: 404 });

  const now = Date.now();
  const updated = await prisma.automation.update({
    where: { id },
    data: {
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(body.runNow
        ? {
            lastRunAt: new Date(now),
            runs: { increment: 1 },
            nextRunAt: new Date(now + 24 * 3600_000),
          }
        : {}),
    },
  });

  return NextResponse.json({ automation: toAutomation(updated) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { count } = await prisma.automation.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Automation tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
