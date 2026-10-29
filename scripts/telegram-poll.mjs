/**
 * Mode lokal tanpa URL publik: long-polling Telegram lalu teruskan update
 * ke webhook Next.js di localhost.
 *
 *   1. npm run dev
 *   2. npm run telegram:poll
 */
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const baseUrl = (process.env.TELEGRAM_LOCAL_URL ?? "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN belum diset.");
  process.exit(1);
}

let offset = 0;
let stopping = false;

async function telegram(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    signal: AbortSignal.timeout(35_000),
  });
  return res.json().catch(() => ({}));
}

async function forward(update) {
  const headers = { "content-type": "application/json" };
  if (secret) headers["x-telegram-bot-api-secret-token"] = secret;
  const res = await fetch(`${baseUrl}/api/telegram/webhook`, {
    method: "POST",
    headers,
    body: JSON.stringify(update),
  });
  if (!res.ok) console.error(`Webhook lokal membalas HTTP ${res.status}`);
}

async function tickCron() {
  try {
    await fetch(`${baseUrl}/api/cron`, { cache: "no-store" });
  } catch {
    // dev server belum siap — abaikan
  }
}

async function main() {
  // getUpdates tidak bisa dipakai saat webhook aktif.
  await telegram("deleteWebhook", { drop_pending_updates: false });
  const me = await telegram("getMe");
  if (!me.ok) {
    console.error("Token bot tidak valid:", me.description);
    process.exit(1);
  }
  console.log(`Polling @${me.result.username} → ${baseUrl}`);
  console.log("Tekan Ctrl+C untuk berhenti.\n");

  setInterval(tickCron, 10_000);
  await tickCron();

  while (!stopping) {
    try {
      const data = await telegram("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message", "edited_message", "callback_query"],
      });
      if (!data.ok) {
        console.error("getUpdates gagal:", data.description);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      for (const update of data.result ?? []) {
        offset = update.update_id + 1;
        await forward(update);
      }
    } catch (error) {
      if (stopping) break;
      console.error("Polling error:", error.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

process.on("SIGINT", () => {
  stopping = true;
  console.log("\nBerhenti.");
  process.exit(0);
});

main();
