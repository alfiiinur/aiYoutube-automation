import { NextResponse } from "next/server";
import { syncJobs } from "@/app/lib/jobs";
import { publishDuePosts } from "@/app/lib/posts";
import { runDueAutomations } from "@/app/lib/automations";

export const dynamic = "force-dynamic";

/**
 * Tick ringan untuk memajukan pipeline, mengirim postingan yang jatuh tempo,
 * menjalankan automation yang tiba jadwalnya, & mengirim notifikasi Telegram.
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
  const posts = await publishDuePosts();
  const automations = await runDueAutomations();
  return NextResponse.json({
    ok: true,
    jobs: jobs.length,
    posts: posts.length,
    automations: automations.length,
  });
}
