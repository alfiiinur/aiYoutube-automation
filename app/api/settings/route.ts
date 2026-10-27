import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ENV_KEYS = ["OPENAI_API_KEY", "YOUTUBE_CLIENT_ID", "RENDER_API_KEY", "ELEVENLABS_API_KEY"];

export async function GET() {
  const connected: Record<string, boolean> = {};
  for (const key of ENV_KEYS) {
    connected[key] = Boolean(process.env[key]);
  }
  return NextResponse.json({ connected });
}