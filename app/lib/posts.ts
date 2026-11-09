import { prisma, socialPostCreateData, toSocialAccount, toSocialPost } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { publishPost, shouldPublishNow } from "@/app/lib/publisher";
import { notifyPostResult } from "@/app/lib/telegram";
import type { SocialPlatform, SocialPost } from "@/app/types";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export class PostInputError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type CreatePostInput = {
  platform: unknown;
  jobId?: unknown;
  jobTitle?: unknown;
  caption?: unknown;
  hashtags?: unknown;
  mediaUrl?: unknown;
  scheduledAt: unknown;
};

/** Hanya izinkan aset upload internal (/api/uploads/...) atau URL http(s) absolut. */
function cleanMediaUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new PostInputError(400, "Media tidak valid");
  const url = value.trim();
  if (!url) return undefined;
  if (url.startsWith("/api/uploads/") || /^https?:\/\//i.test(url)) return url.slice(0, 1000);
  throw new PostInputError(400, "Media tidak valid. Upload lewat kolom stock video.");
}

/**
 * Buat postingan Auto Post — dipakai API web dan automation.
 * jobId opsional: postingan stock video boleh tanpa job (wajib ada caption/media).
 */
export async function createSocialPost(input: CreatePostInput): Promise<SocialPost> {
  const platform = String(input.platform ?? "") as SocialPlatform;
  if (!SOCIAL_PLATFORMS.includes(platform)) {
    throw new PostInputError(400, "Platform tidak valid");
  }

  const scheduledAt = String(input.scheduledAt ?? "").trim();
  if (!isFinite(new Date(scheduledAt).getTime())) {
    throw new PostInputError(400, "Jadwal posting tidak valid");
  }

  const jobId = String(input.jobId ?? "").trim();
  const jobRow = jobId ? await prisma.videoJob.findUnique({ where: { id: jobId } }) : null;
  if (jobId && !jobRow) {
    throw new PostInputError(404, "Job tidak ditemukan. Pilih job yang sudah berstatus Siap.");
  }

  const caption = String(input.caption ?? jobRow?.caption ?? "").trim();
  const mediaUrl = cleanMediaUrl(input.mediaUrl);
  if (!jobRow && !caption && !mediaUrl) {
    throw new PostInputError(400, "Isi caption atau upload stock video untuk postingan tanpa job.");
  }

  const hashtags = Array.isArray(input.hashtags)
    ? input.hashtags.map(String).filter(Boolean)
    : (jobRow?.hashtags ?? []);
  const jobTitle = (
    String(input.jobTitle ?? "").trim() ||
    jobRow?.title ||
    caption.slice(0, 60) ||
    "Stock video"
  ).slice(0, 160);

  const created: SocialPost = {
    id: newId("post"),
    jobId: jobRow?.id,
    jobTitle: jobTitle || "Video",
    platform,
    caption,
    hashtags,
    mediaUrl,
    scheduledAt: new Date(scheduledAt).toISOString(),
    status: "scheduled",
    simulated: true,
    createdAt: Date.now(),
  };

  // Posting sekarang alias scheduledAt <= sekarang akan langsung diproses.
  if (shouldPublishNow(created.scheduledAt)) {
    const accountRow = await prisma.socialAccount.findFirst({
      where: { platform, enabled: true },
      orderBy: { createdAt: "desc" },
    });
    const result = await publishPost(created, accountRow ? toSocialAccount(accountRow) : undefined);
    if (result.ok) {
      created.status = "sent";
      created.publishedAt = new Date().toISOString();
      created.postUrl = result.postUrl;
      created.simulated = result.simulated;
    } else {
      created.status = "failed";
      created.error = result.error;
      created.simulated = result.simulated;
    }
  }

  const row = await prisma.socialPost.create({ data: socialPostCreateData(created) });
  const post = toSocialPost(row);
  await notifyPostResult(post);
  return post;
}

/**
 * Publish semua postingan terjadwal yang sudah tiba waktunya, berurutan.
 * Dipanggil dari GET /api/posts dan /api/cron agar tombol Jadwalkan berfungsi.
 */
export async function publishDuePosts(limit = 20): Promise<SocialPost[]> {
  const rows = await prisma.socialPost.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  const done: SocialPost[] = [];
  for (const row of rows) {
    const post = toSocialPost(row);
    const accountRow = await prisma.socialAccount.findFirst({
      where: { platform: post.platform, enabled: true },
      orderBy: { createdAt: "desc" },
    });
    const result = await publishPost(post, accountRow ? toSocialAccount(accountRow) : undefined);
    const data = result.ok
      ? {
          status: "sent" as const,
          publishedAt: new Date(),
          postUrl: result.postUrl ?? null,
          simulated: result.simulated,
          error: null,
        }
      : {
          status: "failed" as const,
          simulated: result.simulated,
          error: result.error ?? "Gagal mempublikasikan postingan",
        };
    // Klaim hanya kalau masih scheduled — cegah pemrosesan ganda antar worker.
    const claimed = await prisma.socialPost.updateMany({
      where: { id: post.id, status: "scheduled" },
      data,
    });
    if (claimed.count === 0) continue;
    const fresh = await prisma.socialPost.findUnique({ where: { id: post.id } });
    if (!fresh) continue;
    const updated = toSocialPost(fresh);
    await notifyPostResult(updated);
    done.push(updated);
  }
  return done;
}
