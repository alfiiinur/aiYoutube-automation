import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const jobs = db.jobs;
  const ready = jobs.filter((j) => j.status === "ready").length;
  const active = jobs.filter((j) => j.status !== "ready" && j.status !== "failed").length;
  const byPlatform = db.references.reduce<Record<string, number>>((acc, r) => {
    acc[r.platform] = (acc[r.platform] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    stats: {
      totalJobs: jobs.length,
      ready,
      active,
      failed: jobs.filter((j) => j.status === "failed").length,
      references: db.references.length,
      automations: db.automations.length,
      activeAutomations: db.automations.filter((a) => a.enabled).length,
      byPlatform,
      totalSeconds: jobs.reduce((s, j) => s + j.durationSec, 0),
    },
  });
}