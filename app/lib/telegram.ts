import type { SocialPost, VideoJob } from "@/app/types";

/* ---------------- config ---------------- */

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

function telegramToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

/** Chat yang boleh memakai bot (TELEGRAM_CHAT_ID + TELEGRAM_ALLOWED_CHAT_IDS). */
export function allowedChatIds(): string[] {
  const raw = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_ALLOWED_CHAT_IDS]
    .filter(Boolean)
    .join(",");
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export function isChatAllowed(chatId: string | number) {
  const allowed = allowedChatIds();
  // Belum ada allowlist → izinkan agar setup pertama tetap bisa memakai /id.
  if (allowed.length === 0) return true;
  return allowed.includes(String(chatId));
}

/* ---------------- low level API ---------------- */

export async function telegramApi<T = unknown>(
  method: string,
  payload: Record<string, unknown> = {},
): Promise<T | null> {
  const token = telegramToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: T;
      description?: string;
    };
    if (!res.ok || data.ok === false) {
      console.error(`[telegram] ${method} gagal:`, data.description ?? res.status);
      return null;
    }
    return (data.result ?? null) as T | null;
  } catch (error) {
    console.error(`[telegram] ${method} error:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function sendTelegramMessage(
  chatId: string | number | undefined,
  text: string,
  extra: Record<string, unknown> = {},
) {
  const target = chatId ?? process.env.TELEGRAM_CHAT_ID?.trim();
  if (!target) return null;
  return telegramApi("sendMessage", {
    chat_id: target,
    text: truncate(text, 4000),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

export async function sendChatAction(chatId: string | number, action = "typing") {
  return telegramApi("sendChatAction", { chat_id: chatId, action });
}

export async function answerCallbackQuery(id: string, text?: string) {
  return telegramApi("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
}

/* ---------------- notifications ---------------- */

async function broadcast(text: string) {
  const targets = allowedChatIds();
  if (targets.length === 0) {
    const fallback = process.env.TELEGRAM_CHAT_ID?.trim();
    if (fallback) targets.push(fallback);
  }
  await Promise.allSettled(targets.map((chatId) => sendTelegramMessage(chatId, text)));
}

export async function notifyJobReady(job: VideoJob) {
  if (!telegramConfigured()) return;
  const url = webUrl(`/jobs/${job.id}`);
  await broadcast(
    [
      "✅ <b>Video selesai</b>",
      `<b>${escapeHtml(job.title || "Tanpa judul")}</b>`,
      `${job.durationSec}s · ${escapeHtml(job.aspectRatio)} · ${escapeHtml(job.style)}`,
      `ID: <code>${escapeHtml(job.id)}</code>`,
      url ? `Buka: ${escapeHtml(url)}` : "",
      "",
      job.hook ? `<i>${escapeHtml(truncate(job.hook, 220))}</i>` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export async function notifyJobCreated(job: VideoJob) {
  if (!telegramConfigured()) return;
  await broadcast(
    [
      "🎬 <b>Job dibuat</b>",
      `<b>${escapeHtml(job.title || "Tanpa judul")}</b>`,
      `ID: <code>${escapeHtml(job.id)}</code>`,
      "Saya kabari lagi saat render selesai.",
    ].join("\n"),
  );
}

export async function notifyPostResult(post: SocialPost) {
  if (!telegramConfigured() || (post.status !== "sent" && post.status !== "failed")) return;
  const url = webUrl("/publish");
  await broadcast(
    [
      post.status === "sent" ? "📤 <b>Postingan terkirim</b>" : "⚠️ <b>Postingan gagal</b>",
      `<b>${escapeHtml(post.jobTitle)}</b>`,
      `${escapeHtml(post.platform)}${post.simulated ? " (simulasi)" : ""}`,
      post.error ? escapeHtml(truncate(post.error, 200)) : "",
      url ? `Buka: ${escapeHtml(url)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

/* ---------------- formatting ---------------- */

const STATUS_EMOJI: Record<VideoJob["status"], string> = {
  queued: "🕒",
  analyzing: "🔍",
  scripting: "✍️",
  rendering: "🎞️",
  ready: "✅",
  failed: "❌",
};

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function formatJobLine(job: VideoJob) {
  return `${STATUS_EMOJI[job.status]} ${escapeHtml(truncate(job.title || "Tanpa judul", 34))} · ${job.progress}%`;
}

export function formatJobDetail(job: VideoJob) {
  const url = webUrl(`/jobs/${job.id}`);
  return [
    `${STATUS_EMOJI[job.status]} <b>${escapeHtml(job.title || "Tanpa judul")}</b>`,
    `Status: <b>${job.status}</b> · ${job.progress}%`,
    `ID: <code>${escapeHtml(job.id)}</code>`,
    `${job.durationSec}s · ${escapeHtml(job.aspectRatio)} · ${escapeHtml(job.style)} · ${escapeHtml(job.voice)}`,
    "",
    job.hook ? `🎯 <b>Hook</b>\n${escapeHtml(truncate(job.hook, 300))}` : "",
    job.caption ? `\n📝 <b>Caption</b>\n${escapeHtml(truncate(job.caption, 500))}` : "",
    job.hashtags.length ? `\n${escapeHtml(job.hashtags.slice(0, 12).join(" "))}` : "",
    job.error ? `\n❌ ${escapeHtml(truncate(job.error, 200))}` : "",
    url ? `\n🔗 ${escapeHtml(url)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatStats(stats: {
  totalJobs: number;
  ready: number;
  active: number;
  failed: number;
  references: number;
  automations: number;
  activeAutomations: number;
  totalSeconds: number;
}) {
  return [
    "📊 <b>Studio AI</b>",
    `Job: <b>${stats.totalJobs}</b> (${stats.ready} siap · ${stats.active} aktif · ${stats.failed} gagal)`,
    `Referensi: <b>${stats.references}</b>`,
    `Automation: <b>${stats.automations}</b> (${stats.activeAutomations} aktif)`,
    `Total durasi: <b>${stats.totalSeconds}s</b>`,
    "",
    "/jobs · /generate &lt;prompt&gt; · /posts · /help",
  ].join("\n");
}

export function webUrl(path = "") {
  const base =
    process.env.TELEGRAM_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${path}`;
}

export const HELP_TEXT = [
  "🤖 <b>Studio AI Bot</b>",
  "",
  "<b>Perintah</b>",
  "/generate &lt;prompt&gt; — buat job video baru",
  "   opsi: --ratio 9:16 --dur 45 --style cinematic --voice female-id",
  "/jobs — 6 job terakhir",
  "/job &lt;id&gt; — detail job (tanpa id = terbaru)",
  "/status — ringkasan dashboard",
  "/ref &lt;url&gt; — tambah referensi YouTube/IG/TikTok",
  "/posts — jadwal posting terbaru",
  "/id — lihat chat ID kamu",
  "/help — bantuan ini",
  "",
  "Notifikasi otomatis dikirim saat render selesai atau postingan terkirim.",
].join("\n");
