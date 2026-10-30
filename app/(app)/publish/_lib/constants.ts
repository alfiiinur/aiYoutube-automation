import type { SocialPlatform, SocialPost } from "../../../types";

export const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "threads", label: "Threads" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  threads: "Threads",
  instagram: "Instagram",
  facebook: "Facebook",
};

export const POST_STATUS_STYLE: Record<SocialPost["status"], string> = {
  scheduled: "bg-white/10 text-white/70",
  sent: "bg-white text-black",
  failed: "border border-white/25 bg-transparent text-white/60",
};

export const POST_STATUS_LABEL: Record<SocialPost["status"], string> = {
  scheduled: "terjadwal",
  sent: "terkirim",
  failed: "gagal",
};
