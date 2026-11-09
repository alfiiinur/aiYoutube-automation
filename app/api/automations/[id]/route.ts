import { NextResponse } from "next/server";
import { prisma, toAutomation } from "@/app/lib/db";
import { runAutomation } from "@/app/lib/automations";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean; runNow?: boolean };

  const row = await prisma.automation.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Automation tidak ditemukan" }, { status: 404 });

  if (body.runNow) {
    try {
      const result = await runAutomation(id);
      let automation = result.automation;
      if (typeof body.enabled === "boolean" && body.enabled !== automation.enabled) {
        const toggled = await prisma.automation.update({
          where: { id },
          data: { enabled: body.enabled },
        });
        automation = toAutomation(toggled);
      }
      return NextResponse.json({
        automation,
        jobId: result.job.id,
        postId: result.postId ?? null,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Gagal menjalankan automation" },
        { status: 500 },
      );
    }
  }

  const updated = await prisma.automation.update({
    where: { id },
    data: {
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
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
