import { Prisma, PrismaClient } from "@prisma/client";
import { isThumbnailTemplate } from "@/app/lib/thumbnail-templates";
import type {
  AspectRatio,
  Automation,
  EditorMedia,
  EditorProject,
  Goal,
  GoalMetric,
  JobStatus,
  PromptHistoryEntry,
  PromptSkill,
  ReferenceSource,
  ScheduleNote,
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
type PromptSkillRow = Prisma.PromptSkillGetPayload<object>;
type PromptHistoryRow = Prisma.PromptHistoryGetPayload<object>;
type GoalRow = Prisma.GoalGetPayload<object>;
type AutomationRow = Prisma.AutomationGetPayload<object>;
type SocialAccountRow = Prisma.SocialAccountGetPayload<object>;
type SocialPostRow = Prisma.SocialPostGetPayload<object>;
type ScheduleNoteRow = Prisma.ScheduleNoteGetPayload<object>;

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
    thumbnailTemplate: isThumbnailTemplate(row.thumbnailTemplate) ? row.thumbnailTemplate : "bold",
    musicMood: row.musicMood,
    logs: (row.logs ?? []) as unknown as VideoJob["logs"],
    media: (row.media ?? []) as unknown as EditorMedia[],
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

export function toPromptSkill(row: PromptSkillRow): PromptSkill {
  return {
    id: row.id,
    prompt: row.prompt,
    series: row.series ?? undefined,
    part: row.part ?? undefined,
    aspectRatio: row.aspectRatio as AspectRatio,
    durationSec: row.durationSec,
    style: row.style,
    voice: row.voice,
    model: row.model,
    useCount: row.useCount,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export function toPromptHistory(row: PromptHistoryRow): PromptHistoryEntry {
  const ideas = (Array.isArray(row.ideas) ? row.ideas : []).flatMap((e): PromptHistoryEntry["ideas"] => {
    if (!e || typeof e !== "object") return [];
    const item = e as { title?: unknown; prompt?: unknown; angle?: unknown };
    if (typeof item.title !== "string" || typeof item.prompt !== "string") return [];
    const angle = typeof item.angle === "string" && item.angle ? item.angle : undefined;
    return [{ title: item.title, prompt: item.prompt, ...(angle ? { angle } : {}) }];
  });
  return {
    id: row.id,
    topic: row.topic,
    count: row.count,
    ideas,
    source: row.source === "ai" ? "ai" : "local",
    notice: row.notice ?? null,
    at: row.createdAt.getTime(),
  };
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    metric: row.metric as GoalMetric,
    target: row.target,
    deadline: toIso(row.deadline),
    completedAt: toMs(row.completedAt),
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    plan: (row.plan ?? undefined) as unknown as Goal["plan"],
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
    thumbnailTemplate: job.thumbnailTemplate,
    musicMood: job.musicMood,
    logs: jsonArray(job.logs),
    media: jsonArray(job.media),
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

export function goalCreateData(goal: Goal): Prisma.GoalUncheckedCreateInput {
  return {
    id: goal.id,
    title: goal.title,
    metric: goal.metric,
    target: goal.target,
    deadline: goal.deadline ? new Date(goal.deadline) : null,
    completedAt: goal.completedAt ? toDate(goal.completedAt) : null,
    createdAt: toDate(goal.createdAt),
    updatedAt: toDate(goal.updatedAt),
  };
}

export function promptSkillCreateData(skill: PromptSkill): Prisma.PromptSkillUncheckedCreateInput {
  return {
    id: skill.id,
    prompt: skill.prompt,
    series: skill.series ?? null,
    part: skill.part ?? null,
    aspectRatio: skill.aspectRatio,
    durationSec: skill.durationSec,
    style: skill.style,
    voice: skill.voice,
    model: skill.model,
    useCount: skill.useCount,
    createdAt: toDate(skill.createdAt),
    updatedAt: toDate(skill.updatedAt),
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

export function toScheduleNote(row: ScheduleNoteRow): ScheduleNote {
  return {
    id: row.id,
    day: row.day,
    text: row.text,
    color: row.color as ScheduleNote["color"],
    createdAt: row.createdAt.getTime(),
  };
}

export function scheduleNoteCreateData(note: ScheduleNote): Prisma.ScheduleNoteUncheckedCreateInput {
  return {
    id: note.id,
    day: note.day,
    text: note.text,
    color: note.color,
    createdAt: toDate(note.createdAt),
  };
}
