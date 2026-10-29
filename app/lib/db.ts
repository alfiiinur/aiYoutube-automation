import { Prisma, PrismaClient } from "@prisma/client";
import type {
  AspectRatio,
  Automation,
  EditorProject,
  JobStatus,
  ReferenceSource,
  SocialAccount,
  SocialPlatform,
  SocialPost,
  StoryboardScene,
  VideoJob,
} from "@/app/types";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/* ---------------- value helpers ---------------- */

export const toDate = (ms: number) => new Date(ms);
export const toMs = (date: Date | null | undefined) => (date ? date.getTime() : undefined);
export const toIso = (date: Date | null | undefined) => (date ? date.toISOString() : undefined);

const JSON_EMPTY_ARRAY = [] as unknown as Prisma.InputJsonValue;

function jsonArray<T>(value: T[] | undefined): Prisma.InputJsonValue {
  return (value ?? JSON_EMPTY_ARRAY) as Prisma.InputJsonValue;
}

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/* ---------------- row -> app type ---------------- */

type JobRow = Prisma.VideoJobGetPayload<object>;
type ReferenceRow = Prisma.ReferenceSourceGetPayload<object>;
type AutomationRow = Prisma.AutomationGetPayload<object>;
type SocialAccountRow = Prisma.SocialAccountGetPayload<object>;
type SocialPostRow = Prisma.SocialPostGetPayload<object>;

export function toVideoJob(row: JobRow): VideoJob {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    referenceIds: row.referenceIds,
    aspectRatio: row.aspectRatio as AspectRatio,
    durationSec: row.durationSec,
    style: row.style,
    voice: row.voice,
    model: row.model,
    status: row.status as JobStatus,
    progress: row.progress,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    hook: row.hook,
    script: row.script,
    caption: row.caption,
    hashtags: row.hashtags,
    scenes: (row.scenes ?? []) as unknown as StoryboardScene[],
    thumbnailIdea: row.thumbnailIdea,
    musicMood: row.musicMood,
    logs: (row.logs ?? []) as unknown as VideoJob["logs"],
    error: row.error ?? undefined,
    editor: (row.editor ?? undefined) as unknown as EditorProject | undefined,
  };
}

export function toReference(row: ReferenceRow): ReferenceSource {
  return {
    id: row.id,
    url: row.url,
    platform: row.platform as ReferenceSource["platform"],
    title: row.title,
    author: row.author ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    description: row.description ?? undefined,
    durationHint: row.durationHint ?? undefined,
    insights: row.insights,
    tags: row.tags,
    createdAt: row.createdAt.getTime(),
  };
}

export function toAutomation(row: AutomationRow): Automation {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    cron: row.cron,
    humanSchedule: row.humanSchedule,
    promptTemplate: row.promptTemplate,
    platform: row.platform as Automation["platform"],
    privacy: row.privacy as Automation["privacy"],
    lastRunAt: toMs(row.lastRunAt),
    nextRunAt: toMs(row.nextRunAt),
    runs: row.runs,
    createdAt: row.createdAt.getTime(),
  };
}

export function toSocialAccount(row: SocialAccountRow): SocialAccount {
  return {
    id: row.id,
    platform: row.platform as SocialPlatform,
    accountName: row.accountName,
    accessToken: row.accessToken ?? undefined,
    userId: row.userId ?? undefined,
    enabled: row.enabled,
    createdAt: row.createdAt.getTime(),
  };
}

export function toSocialPost(row: SocialPostRow): SocialPost {
  return {
    id: row.id,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    platform: row.platform as SocialPlatform,
    caption: row.caption,
    hashtags: row.hashtags,
    mediaUrl: row.mediaUrl ?? undefined,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status as SocialPost["status"],
    publishedAt: toIso(row.publishedAt),
    postUrl: row.postUrl ?? undefined,
    simulated: row.simulated,
    error: row.error ?? undefined,
    createdAt: row.createdAt.getTime(),
  };
}

/* ---------------- app type -> write payload ---------------- */

export function jobCreateData(job: VideoJob): Prisma.VideoJobUncheckedCreateInput {
  return {
    id: job.id,
    title: job.title,
    prompt: job.prompt,
    referenceIds: job.referenceIds,
    aspectRatio: job.aspectRatio,
    durationSec: job.durationSec,
    style: job.style,
    voice: job.voice,
    model: job.model,
    status: job.status,
    progress: job.progress,
    createdAt: toDate(job.createdAt),
    updatedAt: toDate(job.updatedAt),
    hook: job.hook,
    script: job.script,
    caption: job.caption,
    hashtags: job.hashtags,
    scenes: jsonArray(job.scenes),
    thumbnailIdea: job.thumbnailIdea,
    musicMood: job.musicMood,
    logs: jsonArray(job.logs),
    error: job.error ?? null,
    editor: job.editor ? (job.editor as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
  };
}

export function editorJson(editor: EditorProject): Prisma.InputJsonValue {
  return editor as unknown as Prisma.InputJsonValue;
}

export function referenceCreateData(ref: ReferenceSource): Prisma.ReferenceSourceUncheckedCreateInput {
  return {
    id: ref.id,
    url: ref.url,
    platform: ref.platform,
    title: ref.title,
    author: ref.author ?? null,
    thumbnail: ref.thumbnail ?? null,
    description: ref.description ?? null,
    durationHint: ref.durationHint ?? null,
    insights: ref.insights,
    tags: ref.tags,
    createdAt: toDate(ref.createdAt),
  };
}

export function automationCreateData(auto: Automation): Prisma.AutomationUncheckedCreateInput {
  return {
    id: auto.id,
    name: auto.name,
    enabled: auto.enabled,
    cron: auto.cron,
    humanSchedule: auto.humanSchedule,
    promptTemplate: auto.promptTemplate,
    platform: auto.platform,
    privacy: auto.privacy,
    lastRunAt: auto.lastRunAt ? toDate(auto.lastRunAt) : null,
    nextRunAt: auto.nextRunAt ? toDate(auto.nextRunAt) : null,
    runs: auto.runs,
    createdAt: toDate(auto.createdAt),
  };
}

export function socialAccountCreateData(
  account: SocialAccount,
): Prisma.SocialAccountUncheckedCreateInput {
  return {
    id: account.id,
    platform: account.platform,
    accountName: account.accountName,
    accessToken: account.accessToken ?? null,
    userId: account.userId ?? null,
    enabled: account.enabled,
    createdAt: toDate(account.createdAt),
  };
}

export function socialPostCreateData(post: SocialPost): Prisma.SocialPostUncheckedCreateInput {
  return {
    id: post.id,
    jobId: post.jobId,
    jobTitle: post.jobTitle,
    platform: post.platform,
    caption: post.caption,
    hashtags: post.hashtags,
    mediaUrl: post.mediaUrl ?? null,
    scheduledAt: new Date(post.scheduledAt),
    status: post.status,
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    postUrl: post.postUrl ?? null,
    simulated: post.simulated,
    error: post.error ?? null,
    createdAt: toDate(post.createdAt),
  };
}

export function socialPostUpdateData(post: SocialPost): Prisma.SocialPostUncheckedUpdateInput {
  const { id: _id, ...rest } = socialPostCreateData(post);
  return rest;
}
