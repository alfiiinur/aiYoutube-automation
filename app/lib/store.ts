import type { VideoJob } from "@/app/types";

/* ---------------- ids ---------------- */

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------------- pipeline simulation ---------------- */

const STAGE_PLAN: { status: VideoJob["status"]; until: number; message: string }[] = [
  { status: "analyzing", until: 5, message: "Menganalisis prompt & referensi" },
  { status: "scripting", until: 12, message: "Menyusun hook, script, dan storyboard" },
  { status: "rendering", until: 26, message: "Merender frame & mixing audio" },
  { status: "ready", until: Number.POSITIVE_INFINITY, message: "Video siap diunduh / dijadwalkan" },
];

function progressFor(elapsedSec: number) {
  const total = 26;
  return Math.max(2, Math.min(100, Math.round((elapsedSec / total) * 100)));
}

/**
 * Jobs advance automatically based on wall-clock time, so the UI feels live
 * without needing a background worker or external queue.
 *
 * This is a pure projection over the stored row: the database keeps the last
 * persisted state and callers decide when the projection is written back.
 */
export function evolve(job: VideoJob): VideoJob {
  if (job.status === "ready" || job.status === "failed") return job;

  const elapsed = (Date.now() - job.createdAt) / 1000;
  const stage = STAGE_PLAN.find((s) => elapsed < s.until) ?? STAGE_PLAN[STAGE_PLAN.length - 1];
  const progress = stage.status === "ready" ? 100 : progressFor(elapsed);

  if (stage.status === job.status && progress === job.progress) return job;

  const logs = [...job.logs];
  if (stage.status !== job.status) {
    logs.push({ at: Date.now(), message: stage.message });
  }

  return {
    ...job,
    status: stage.status,
    progress,
    logs,
    updatedAt: Date.now(),
  };
}

export function evolveAll(jobs: VideoJob[]): VideoJob[] {
  return jobs.map(evolve);
}
