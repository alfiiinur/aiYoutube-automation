import { NextResponse } from "next/server";
import { prisma, toSocialPost } from "@/app/lib/db";
import { createSocialPost, PostInputError, publishDuePosts } from "@/app/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  // Kirim dulu yang sudah tiba jadwalnya agar daftar selalu mutakhir.
  await publishDuePosts();
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

  try {
    const post = await createSocialPost({
      platform: body.platform,
      jobId: body.jobId,
      jobTitle: body.jobTitle,
      caption: body.caption,
      hashtags: body.hashtags,
      mediaUrl: body.mediaUrl,
      scheduledAt: body.scheduledAt,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    if (e instanceof PostInputError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
