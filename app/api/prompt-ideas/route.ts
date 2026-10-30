import { NextResponse } from "next/server";
import { clampCount, generatePromptIdeas } from "@/app/lib/prompt-ideas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim().replace(/\s+/g, " ");
  if (topic.length < 3) {
    return NextResponse.json({ error: "Topik minimal 3 karakter" }, { status: 400 });
  }
  if (topic.length > 200) {
    return NextResponse.json({ error: "Topik maksimal 200 karakter" }, { status: 400 });
  }

  const result = await generatePromptIdeas(topic, clampCount(body.count));
  return NextResponse.json(result);
}
