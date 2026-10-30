import { NextResponse } from "next/server";
import { prisma, goalCreateData, toGoal } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import type { GoalMetric, GoalWithProgress } from "@/app/types";

export const dynamic = "force-dynamic";

const METRICS: GoalMetric[] = ["videos_ready", "posts_sent"];

export async function GET() {
  const [readyJobs, sentPosts, rows] = await Promise.all([
    prisma.videoJob.findMany({ where: { status: "ready" }, select: { createdAt: true } }),
    prisma.socialPost.findMany({ where: { status: "sent" }, select: { createdAt: true } }),
    prisma.goal.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const readyAt = readyJobs.map((j) => j.createdAt.getTime());
  const sentAt = sentPosts.map((p) => p.createdAt.getTime());
  const now = Date.now();

  const goals: GoalWithProgress[] = rows.map((row) => {
    const goal = toGoal(row);
    const stamps = goal.metric === "posts_sent" ? sentAt : readyAt;
    const progress = stamps.filter((t) => t >= goal.createdAt).length;
    return {
      ...goal,
      progress,
      reached: progress >= goal.target,
      overdue: goal.completedAt == null && goal.deadline != null && new Date(goal.deadline).getTime() < now,
    };
  });

  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (title.length < 3) {
    return NextResponse.json({ error: "Nama goal minimal 3 karakter" }, { status: 400 });
  }
  const metric = METRICS.includes(body.metric as GoalMetric) ? (body.metric as GoalMetric) : "videos_ready";
  const target = Number.isInteger(Number(body.target))
    ? Math.max(1, Math.min(100000, Number(body.target)))
    : 10;

  let deadline: string | undefined;
  const rawDeadline = String(body.deadline ?? "").trim();
  if (rawDeadline) {
    const parsed = new Date(rawDeadline);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Deadline tidak valid" }, { status: 400 });
    }
    deadline = parsed.toISOString();
  }

  const now = Date.now();
  const row = await prisma.goal.create({
    data: goalCreateData({
      id: newId("goal"),
      title: title.slice(0, 120),
      metric,
      target,
      deadline,
      createdAt: now,
      updatedAt: now,
    }),
  });

  const goal = toGoal(row);
  const created: GoalWithProgress = { ...goal, progress: 0, reached: false, overdue: false };
  return NextResponse.json({ goal: created }, { status: 201 });
}
