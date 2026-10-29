import { prisma, jobCreateData, jsonValue, toReference, toVideoJob } from "@/app/lib/db";
import { evolve, newId } from "@/app/lib/store";
import { generateJobContent } from "@/app/lib/generator";
import { notifyJobReady } from "@/app/lib/telegram";
import type { AspectRatio, VideoJob } from "@/app/types";

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5"];

export type NewJobInput = {
  prompt: string;
  referenceIds?: string[];
  aspectRatio?: string;
  durationSec?: number;
  style?: string;
  voice?: string;
  model?: string;
};

/** Buat job baru — dipakai oleh API web dan bot Telegram. */
export async function createJob(input: NewJobInput): Promise<VideoJob> {
  const prompt = input.prompt.trim();
  const referenceIds = input.referenceIds ?? [];
  const aspectRatio = ASPECT_RATIOS.includes(input.aspectRatio as AspectRatio)
    ? (input.aspectRatio as AspectRatio)
    : "9:16";
  const durationSec = Number.isFinite(Number(input.durationSec))
    ? Math.max(10, Math.min(180, Number(input.durationSec)))
    : 45;
  const style = String(input.style ?? "cinematic");
  const voice = String(input.voice ?? "female-id");
  const model = String(input.model ?? "studio-v1");

  const referenceRows = referenceIds.length
    ? await prisma.referenceSource.findMany({ where: { id: { in: referenceIds } } })
    : [];

  const content = generateJobContent({
    prompt,
    references: referenceRows.map(toReference),
    style,
    voice,
    durationSec,
    aspectRatio,
    model,
  });

  const now = Date.now();
  const created: VideoJob = {
    id: newId("job"),
    prompt,
    referenceIds,
    aspectRatio,
    durationSec,
    style,
    voice,
    model,
    status: "analyzing",
    progress: 2,
    createdAt: now,
    updatedAt: now,
    ...content,
    logs: [{ at: now, message: "Job dibuat, masuk antrean render" }],
  };

  const row = await prisma.videoJob.create({ data: jobCreateData(created) });
  return toVideoJob(row);
}

/**
 * Proyeksikan progres pipeline ke database. Status yang berubah ke `ready`
 * dikirim sebagai notifikasi Telegram (sekali saja, dijaga oleh updateMany).
 */
export async function syncJobs(): Promise<VideoJob[]> {
  const rows = await prisma.videoJob.findMany({ orderBy: { createdAt: "desc" } });
  const jobs = rows.map(toVideoJob);
  const evolved = new Map<string, VideoJob>();
  const readyToNotify: VideoJob[] = [];

  await Promise.all(
    jobs.map(async (job) => {
      const next = evolve(job);
      if (next === job) return;
      evolved.set(job.id, next);

      const { count } = await prisma.videoJob.updateMany({
        where: { id: job.id, status: job.status },
        data: {
          status: next.status,
          progress: next.progress,
          logs: jsonValue(next.logs),
          updatedAt: new Date(next.updatedAt),
        },
      });

      if (count > 0 && job.status !== "ready" && next.status === "ready") {
        readyToNotify.push(next);
      }
    }),
  );

  await Promise.allSettled(readyToNotify.map((job) => notifyJobReady(job)));

  return jobs.map((job) => evolved.get(job.id) ?? job);
}

export async function findJob(id: string): Promise<VideoJob | null> {
  const row = await prisma.videoJob.findUnique({ where: { id } });
  return row ? evolve(toVideoJob(row)) : null;
}
