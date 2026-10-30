import { NextResponse } from "next/server";
import { getContentAnalytics } from "@/app/lib/analytics";
import { generateAdvice } from "@/app/lib/advice";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = Number(searchParams.get("range") ?? 14);
  const analytics = await getContentAnalytics(range);
  const advice = await generateAdvice(analytics);
  return NextResponse.json({ advice });
}
