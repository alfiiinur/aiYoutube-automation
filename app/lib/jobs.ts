import { prisma, jobCreateData, jsonValue, toReference, toVideoJob } from "@/app/lib/db";
import { evolve, newId } from "@/app/lib/store";
import { generateJobContent } from "@/app/lib/generator";
import { notifyJobReady } from "@/app/lib/telegram";
import type { AspectRatio, EditorMedia, VideoJob } from "@/app/types";

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5"];

export const MIN_DURATION_SEC = 10;
export const MAX_DURATION_SEC = 600; // 10 menit

/** Samakan batas durasi untuk job & skill prompt. */
export function clampDurationSec(value: unknown, fallback = 45): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(MIN_DURATION_SEC, Math.min(MAX_DURATION_SEC, Math.round(n)));
}

export type NewJobInput = {
  prompt: string;
  referenceIds?: string[];
  aspectRatio?: string;
  durationSec?: number;
  style?: string;
  voice?: string;
  model?: string;
  media?: unknown;
};

/** Hanya izinkan aset hasil upload internal (/api/uploads/...). */
function sanitizeMedia(input: unknown): EditorMedia[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 20).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const m = item as Partial<EditorMedia>;
    if (typeof m.url !== "string" || !m.url.startsWith("/api/uploads/")) return [];
    if (m.kind !== "video" && m.kind !== "image" && m.kind !== "audio") return [];
    const size = typeof m.size === "number" && Number.isFinite(m.size) ? m.size : undefined;
    const duration =
      typeof m.duration === "number" && Number.isFinite(m.duration) && m.duration > 0
        ? Math.min(m.duration, 3600)
        : undefined;
    return [
      {
        url: m.url.slice(0, 500),
        name: String(m.name ?? "Media").slice(0, 160),
        kind: m.kind,
        mime: String(m.mime ?? "").slice(0, 100),
        size,
        duration,
      },
    ];
  });
}

/** Buat job baru — dipakai oleh API web dan bot Telegram. */
export async function createJob(input: NewJobInput): Promise<VideoJob> {
  const prompt = input.prompt.trim();
  const referenceIds = input.referenceIds ?? [];
  const aspectRatio = ASPECT_RATIOS.includes(input.aspectRatio as AspectRatio)
    ? (input.aspectRatio as AspectRatio)
    : "9:16";
  const durationSec = clampDurationSec(input.durationSec);
  const style = String(input.style ?? "cinematic");
  const voice = String(input.voice ?? "female-id");
  const model = String(input.model ?? "studio-v1");
  const media = sanitizeMedia(input.media);

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
    thumbnailTemplate: "bold",
    status: "analyzing",
    progress: 2,
    createdAt: now,
    updatedAt: now,
    ...content,
    media,
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
