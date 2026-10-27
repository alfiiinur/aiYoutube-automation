import { promises as fs } from "fs";
import path from "path";
import type { Db, VideoJob } from "@/app/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const EMPTY: Db = { jobs: [], references: [], automations: [], socialAccounts: [], posts: [] };

let queue: Promise<unknown> = Promise.resolve();

/** Serialize all writes so concurrent requests can't clobber the JSON file. */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readRaw(): Promise<Db> {
  try {
    const txt = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(txt) as Partial<Db>;
    return {
      jobs: parsed.jobs ?? [],
      references: parsed.references ?? [],
      automations: parsed.automations ?? [],
      socialAccounts: parsed.socialAccounts ?? [],
      posts: parsed.posts ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeRaw(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
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

/* ---------------- public API ---------------- */

export async function getDb(): Promise<Db> {
  const db = await readRaw();
  return { ...db, jobs: db.jobs.map(evolve) };
}

export async function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const db = await readRaw();
    db.jobs = db.jobs.map(evolve);
    const result = await fn(db);
    await writeRaw(db);
    return result;
  });
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}