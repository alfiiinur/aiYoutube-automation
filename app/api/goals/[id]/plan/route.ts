import { NextResponse } from "next/server";
import { prisma, jsonValue, toGoal } from "@/app/lib/db";
import { PLAN_MAX, PLAN_MIN, generatePlan } from "@/app/lib/planner";
import type { GoalPlan } from "@/app/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isPlan(value: unknown): value is GoalPlan {
  return !!value && typeof value === "object" && Array.isArray((value as GoalPlan).items);
}

/** Susun (ulang) rencana konten untuk goal — via AI bila key tersedia. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { count?: unknown };
  const count = Math.max(PLAN_MIN, Math.min(PLAN_MAX, Math.floor(Number(body.count)) || 6));

  const row = await prisma.goal.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });

  try {
    const plan = await generatePlan(toGoal(row), count);
    await prisma.goal.update({
      where: { id },
      data: { plan: jsonValue(plan), updatedAt: new Date() },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    console.error("[goals/plan]", e);
    return NextResponse.json({ error: "Gagal menyusun rencana" }, { status: 500 });
  }
}

/** Tandai satu item rencana sudah di-generate (dicatat jobId-nya). */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { itemId?: unknown; jobId?: unknown };
  const itemId = String(body.itemId ?? "");
  const jobId = String(body.jobId ?? "");
  if (!itemId || !jobId) {
    return NextResponse.json({ error: "itemId dan jobId wajib diisi" }, { status: 400 });
  }

  const row = await prisma.goal.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
  if (!isPlan(row.plan)) {
    return NextResponse.json({ error: "Goal ini belum punya rencana" }, { status: 404 });
  }

  const plan = row.plan as GoalPlan;
  const item = plan.items.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Item rencana tidak ditemukan" }, { status: 404 });

  item.status = "generated";
  item.jobId = jobId.slice(0, 80);

  await prisma.goal.update({
    where: { id },
    data: { plan: jsonValue(plan), updatedAt: new Date() },
  });
  return NextResponse.json({ plan });
}
