import { NextResponse } from "next/server";
import { prisma, socialPostCreateData, toSocialAccount, toSocialPost } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { publishPost, shouldPublishNow } from "@/app/lib/publisher";
import { notifyPostResult } from "@/app/lib/telegram";
import type { SocialPlatform, SocialPost } from "@/app/types";

export const dynamic = "force-dynamic";

const PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export async function GET() {
  const rows = await prisma.socialPost.findMany({ orderBy: { scheduledAt: "asc" } });
  return NextResponse.json({ posts: rows.map(toSocialPost) });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const platform = String(body.platform ?? "") as SocialPlatform;
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Platform tidak valid" }, { status: 400 });
  }

  const jobId = String(body.jobId ?? "").trim();
  const scheduledAt = String(body.scheduledAt ?? "").trim();
  if (!isFinite(new Date(scheduledAt).getTime())) {
    return NextResponse.json({ error: "Jadwal posting tidak valid" }, { status: 400 });
  }

  const jobRow = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!jobRow) {
    return NextResponse.json(
      { error: "Job tidak ditemukan. Pilih job yang sudah berstatus Siap." },
      { status: 404 },
    );
  }

  const caption = String(body.caption ?? jobRow.caption ?? "").trim();
  const hashtags = Array.isArray(body.hashtags)
    ? body.hashtags.map(String).filter(Boolean)
    : jobRow.hashtags;

  const created: SocialPost = {
    id: newId("post"),
    jobId,
    jobTitle: jobRow.title || "Video",
    platform,
    caption,
    hashtags,
    mediaUrl: body.mediaUrl ? String(body.mediaUrl) : undefined,
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
  return NextResponse.json({ post }, { status: 201 });
}
