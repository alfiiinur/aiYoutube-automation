import { NextResponse } from "next/server";
import { getStats } from "@/app/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ stats: await getStats() });
}
