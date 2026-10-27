import { NextResponse } from "next/server";
import { getDb, mutate } from "@/app/lib/store";
import { publishPost, shouldPublishNow } from "@/app/lib/publisher";
import type { SocialPost, SocialPlatform } from "@/app/types";

export const dynamic = "force-dynamic";

const PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ post });
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

  const post = await mutate(async (db) => {
    const target = db.posts.find((p) => p.id === id);
    if (!target) return null;

    const nextPlatform = PLATFORMS.includes(body.platform as SocialPlatform)
      ? (body.platform as SocialPlatform)
      : target.platform;
    const nextJob = body.jobId
      ? db.jobs.find((j) => j.id === String(body.jobId))
      : undefined;

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
      const account = db.socialAccounts.find((a) => a.platform === target.platform && a.enabled);
      const result = await publishPost(target, account);
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

    return target;
  });

  if (!post) {
    return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await mutate((db) => {
    const idx = db.posts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    db.posts.splice(idx, 1);
    return true;
  });
  if (!ok) {
    return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}