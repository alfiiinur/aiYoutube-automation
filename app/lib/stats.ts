import { prisma } from "@/app/lib/db";
import { syncJobs } from "@/app/lib/jobs";

export type DashboardStats = {
  totalJobs: number;
  ready: number;
  active: number;
  failed: number;
  references: number;
  automations: number;
  activeAutomations: number;
  byPlatform: Record<string, number>;
  totalSeconds: number;
};

export async function getStats(): Promise<DashboardStats> {
  const [jobs, referenceRows, automationRows] = await Promise.all([
    syncJobs(),
    prisma.referenceSource.findMany({ select: { platform: true } }),
    prisma.automation.findMany({ select: { enabled: true } }),
  ]);

  const ready = jobs.filter((j) => j.status === "ready").length;
  const active = jobs.filter((j) => j.status !== "ready" && j.status !== "failed").length;

  const byPlatform = referenceRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.platform] = (acc[r.platform] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalJobs: jobs.length,
    ready,
    active,
    failed: jobs.filter((j) => j.status === "failed").length,
    references: referenceRows.length,
    automations: automationRows.length,
    activeAutomations: automationRows.filter((a) => a.enabled).length,
    byPlatform,
    totalSeconds: jobs.reduce((s, j) => s + j.durationSec, 0),
  };
}
