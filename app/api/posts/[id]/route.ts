import { NextResponse } from "next/server";
import {
  prisma,
  socialPostUpdateData,
  toSocialAccount,
  toSocialPost,
} from "@/app/lib/db";
import { publishPost, shouldPublishNow } from "@/app/lib/publisher";
import { notifyPostResult } from "@/app/lib/telegram";
import type { SocialPlatform, SocialPost } from "@/app/types";

export const dynamic = "force-dynamic";

const PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await prisma.socialPost.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ post: toSocialPost(row) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const row = await prisma.socialPost.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
  }

  const target: SocialPost = toSocialPost(row);

  const nextPlatform = PLATFORMS.includes(body.platform as SocialPlatform)
    ? (body.platform as SocialPlatform)
    : target.platform;
  const nextJob = body.jobId
    ? await prisma.videoJob.findUnique({ where: { id: String(body.jobId) } })
    : null;

  target.platform = nextPlatform;
  if (nextJob) {
    target.jobId = nextJob.id;
    target.jobTitle = nextJob.title || target.jobTitle;
  }
  if (typeof body.caption === "string") target.caption = body.caption;
  if (Array.isArray(body.hashtags)) {
    target.hashtags = body.hashtags.map(String).filter(Boolean);
  }
  if (typeof body.mediaUrl === "string") target.mediaUrl = body.mediaUrl;
  if (typeof body.scheduledAt === "string") {
    target.scheduledAt = new Date(body.scheduledAt).toISOString();
  }

  // Publish Now manual, bukan sekadar menggeser jadwal.
  if (body.publishNow === true && body.scheduledAt) {
    target.scheduledAt = new Date(String(body.scheduledAt)).toISOString();
  }

  if (target.status !== "sent" && shouldPublishNow(target.scheduledAt)) {
    const accountRow = await prisma.socialAccount.findFirst({
      where: { platform: target.platform, enabled: true },
      orderBy: { createdAt: "desc" },
    });
    const result = await publishPost(
      target,
      accountRow ? toSocialAccount(accountRow) : undefined,
    );
    if (result.ok) {
      target.status = "sent";
      target.publishedAt = new Date().toISOString();
      target.postUrl = result.postUrl;
      target.simulated = result.simulated;
      target.error = undefined;
    } else {
      target.status = "failed";
      target.error = result.error;
      target.simulated = result.simulated;
    }
  }

  if (body.status === "scheduled" && target.status === "failed") {
    target.status = "scheduled";
    target.error = undefined;
  }

  const updated = await prisma.socialPost.update({
    where: { id },
    data: socialPostUpdateData(target),
  });
  const post = toSocialPost(updated);
  await notifyPostResult(post);
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { count } = await prisma.socialPost.deleteMany({ where: { id } });
  if (count === 0) {
    return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
