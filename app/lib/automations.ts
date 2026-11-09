import { prisma, toAutomation } from "@/app/lib/db";
import { createJob } from "@/app/lib/jobs";
import { createSocialPost } from "@/app/lib/posts";
import type { Automation, SocialPlatform, VideoJob } from "@/app/types";

export const AUTOMATION_PLATFORMS: Automation["platform"][] = [
  "youtube",
  "tiktok",
  "instagram",
  "threads",
  "facebook",
];

/** Platform sosial: hasil automation diteruskan ke Auto Post. */
export const SOCIAL_AUTOMATION_PLATFORMS: SocialPlatform[] = ["instagram", "threads", "facebook"];

export function isSocialAutomationPlatform(
  platform: Automation["platform"],
): platform is SocialPlatform {
  return (SOCIAL_AUTOMATION_PLATFORMS as string[]).includes(platform);
}

/** Hitung jadwal jalan berikutnya dari format cron internal ("0 9" / "every:720"). */
export function nextRunFromCron(cron: string, fromMs = Date.now()): number {
  const hours = cron.match(/^\d+\s+(\d+)/);
  const every = cron.startsWith("every:");
  if (every) {
    const minutes = Number(cron.split(":")[1]) || 60;
    return fromMs + minutes * 60_000;
  }
  if (hours) {
    const h = Number(hours[1]) || 9;
    const d = new Date(fromMs);
    d.setHours(h, 0, 0, 0);
    if (d.getTime() <= fromMs) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  return fromMs + 24 * 3600_000;
}

export type AutomationRunResult = {
  automation: Automation;
  job: VideoJob;
  /** Terisi bila platform sosial — postingan yang dibuat di Auto Post. */
  postId?: string;
};

/**
 * Jalankan satu automation: buat job dari template prompt, lalu teruskan ke
 * Auto Post bila platformnya sosial (instagram/threads/facebook).
 */
export async function runAutomation(id: string): Promise<AutomationRunResult> {
  const row = await prisma.automation.findUnique({ where: { id } });
  if (!row) throw new Error("Automation tidak ditemukan");
  const automation = toAutomation(row);

  const job = await createJob({ prompt: automation.promptTemplate });

  let postId: string | undefined;
  if (isSocialAutomationPlatform(automation.platform)) {
    const post = await createSocialPost({
      platform: automation.platform,
      jobId: job.id,
      scheduledAt: new Date().toISOString(),
    });
    postId = post.id;
  }

  const now = Date.now();
  const updated = await prisma.automation.update({
    where: { id },
    data: {
      lastRunAt: new Date(now),
      runs: { increment: 1 },
      nextRunAt: new Date(nextRunFromCron(automation.cron, now)),
    },
  });

  return { automation: toAutomation(updated), job, postId };
}

/** Jalankan semua automation aktif yang sudah tiba jadwalnya, berurutan. */
export async function runDueAutomations(limit = 10): Promise<AutomationRunResult[]> {
  const rows = await prisma.automation.findMany({
    where: { enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: new Date() } }] },
    orderBy: { nextRunAt: "asc" },
    take: limit,
  });

  const results: AutomationRunResult[] = [];
  for (const row of rows) {
    try {
      results.push(await runAutomation(row.id));
    } catch {
      // Satu automation gagal tidak boleh menghentikan yang lain.
    }
  }
  return results;
}
