import { NextResponse } from "next/server";
import { syncJobs } from "@/app/lib/jobs";

export const dynamic = "force-dynamic";

/**
 * Tick ringan untuk memajukan pipeline & mengirim notifikasi Telegram.
 * Panggil dari cron eksternal tiap 1 menit (atau dari scripts/telegram-poll.mjs).
 *
 * Kalau CRON_SECRET diset, wajib kirim header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const jobs = await syncJobs();
  return NextResponse.json({ ok: true, jobs: jobs.length });
}
