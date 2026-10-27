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
}

export interface EditorClip {
  id: string;
  sceneIndex: number;
  start: number;
  end: number;
  title: string;
  visual: string;
  broll: string;
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