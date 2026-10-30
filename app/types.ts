export type JobStatus = "queued" | "analyzing" | "scripting" | "rendering" | "ready" | "failed";

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

export interface ReferenceSource {
  id: string;
  url: string;
  platform: "youtube" | "instagram" | "tiktok" | "web";
  title: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  durationHint?: string;
  insights: string[];
  tags: string[];
  createdAt: number;
}

export interface StoryboardScene {
  index: number;
  timecode: string;
  visual: string;
  onScreenText: string;
  voiceover: string;
  broll: string;
  imageUrl?: string;
  imagePrompt?: string;
}

/* ---------------- video editor ---------------- */

export type EditorTool = "clip" | "voice" | "caption" | "overlay" | "music";

export type EditorTrack = "clip" | "caption" | "overlay" | "music";

export interface EditorSelection {
  track: EditorTrack;
  id: string;
}

export type EditorMediaKind = "video" | "image" | "audio";

export interface EditorMedia {
  url: string;
  name: string;
  kind: EditorMediaKind;
  mime: string;
  size?: number;
  duration?: number;
}

export interface EditorClip {
  id: string;
  sceneIndex: number;
  start: number;
  end: number;
  title: string;
  visual: string;
  broll: string;
  /** Narasi voice over yang dibacakan saat klip ini tampil. */
  voiceover?: string;
  media?: EditorMedia;
}

export type CaptionStyle = "bold" | "karaoke" | "minimal";
export type CaptionPosition = "top" | "middle" | "bottom";

export interface EditorCaption {
  id: string;
  start: number;
  end: number;
  text: string;
  style: CaptionStyle;
  position: CaptionPosition;
}

export type OverlayVariant = "title" | "lower-third" | "badge";

export interface EditorOverlay {
  id: string;
  start: number;
  end: number;
  text: string;
  variant: OverlayVariant;
}

export interface EditorMusic {
  title: string;
  prompt: string;
  style: string;
  exclude: string;
  description: string;
  volume: number;
  file?: EditorMedia;
}

export interface EditorChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
}

export interface EditorProject {
  version: 1;
  duration: number;
  clips: EditorClip[];
  captions: EditorCaption[];
  overlays: EditorOverlay[];
  music: EditorMusic;
  voiceVolume: number;
  captionsEnabled: boolean;
  chat: EditorChatMessage[];
  updatedAt: number;
}

export interface VideoJob {
  id: string;
  title: string;
  prompt: string;
  referenceIds: string[];
  aspectRatio: AspectRatio;
  durationSec: number;
  style: string;
  voice: string;
  model: string;
  status: JobStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  scenes: StoryboardScene[];
  thumbnailIdea: string;
  musicMood: string;
  logs: { at: number; message: string }[];
  error?: string;
  editor?: EditorProject;
  media: EditorMedia[];
}

export interface PromptSkill {
  id: string;
  prompt: string;
  series?: string;
  part?: number;
  aspectRatio: AspectRatio;
  durationSec: number;
  style: string;
  voice: string;
  model: string;
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

export type GoalMetric = "videos_ready" | "posts_sent";

export interface Goal {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  deadline?: string; // ISO
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  plan?: GoalPlan;
}

export interface GoalPlanItem {
  id: string;
  title: string;
  prompt: string;
  angle?: string;
  /** Hari ke-n dari pembuatan rencana (mulai 1). */
  dayOffset: number;
  scheduledAt?: string; // ISO
  status: "planned" | "generated";
  jobId?: string;
}

export interface GoalPlan {
  items: GoalPlanItem[];
  source: "ai" | "local";
  createdAt: number;
  notice?: string;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  reached: boolean;
  overdue: boolean;
}

export interface GoalChatMessage {
  role: "user" | "assistant";
  text: string;
  at: number;
}

/** Snapshot status wizard builder agar chat bisa dilanjutkan. */
export interface GoalChatSnapshot {
  categoryId: string | null;
  customStart: boolean;
  outcome: string | null;
  goalTarget: number | null;
  deadlineChoice: { id: string; label: string; iso?: string; dateLabel?: string } | null;
  step: string;
}

export interface GoalChat {
  id: string;
  title: string;
  snapshot: GoalChatSnapshot;
  transcript: GoalChatMessage[];
  goalId?: string;
  createdAt: number;
  updatedAt: number;
}

export type SocialPlatform = "threads" | "instagram" | "facebook";

export type PublishStatus = "scheduled" | "sent" | "failed";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  accessToken?: string;
  userId?: string; // thread user id / IG user id / FB page id
  enabled: boolean;
  createdAt: number;
}

export interface SocialPost {
  id: string;
  jobId: string;
  jobTitle: string;
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  mediaUrl?: string;
  scheduledAt: string; // ISO
  status: PublishStatus;
  publishedAt?: string;
  postUrl?: string;
  simulated: boolean;
  error?: string;
  createdAt: number;
}

export const NOTE_COLOR_IDS = ["yellow", "pink", "green", "blue", "purple"] as const;

export type NoteColor = (typeof NOTE_COLOR_IDS)[number];

export interface ScheduleNote {
  id: string;
  /** Tanggal lokal YYYY-MM-DD. */
  day: string;
  text: string;
  color: NoteColor;
  createdAt: number;
}

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  cron: string;
  humanSchedule: string;
  promptTemplate: string;
  platform: "youtube" | "tiktok" | "instagram";
  privacy: "public" | "unlisted" | "private";
  lastRunAt?: number;
  nextRunAt?: number;
  runs: number;
  createdAt: number;
}

export interface Db {
  jobs: VideoJob[];
  references: ReferenceSource[];
  automations: Automation[];
  socialAccounts: SocialAccount[];
  posts: SocialPost[];
}
