import { NextResponse } from "next/server";
import { getDb, mutate, newId } from "@/app/lib/store";
import { publishPost, shouldPublishNow } from "@/app/lib/publisher";
import type { SocialPlatform, SocialPost } from "@/app/types";

export const dynamic = "force-dynamic";

const PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export async function GET() {
  const db = await getDb();
  const posts = [...db.posts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  return NextResponse.json({ posts });
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

  const post = await mutate(async (db) => {
    const job = db.jobs.find((j) => j.id === jobId);
    if (!job) {
      throw new Error("Job tidak ditemukan. Pilih job yang sudah berstatus Siap.");
    }

    const caption = String(body.caption ?? job.caption ?? "").trim();
    const hashtags = Array.isArray(body.hashtags)
      ? body.hashtags.map(String).filter(Boolean)
      : job.hashtags ?? [];

    const created: SocialPost = {
      id: newId("post"),
      jobId,
      jobTitle: job.title || "Video",
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
      const account = db.socialAccounts.find(
        (a) => a.platform === platform && a.enabled === true,
      );
      const result = await publishPost(created, account);
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

    db.posts.unshift(created);
    return created;
  });

  return NextResponse.json({ post }, { status: 201 });
}