/**
 * Daftarkan webhook Telegram ke deployment publik.
 *
 *   TELEGRAM_PUBLIC_URL=https://app.example.com npm run telegram:setup
 */
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const publicUrl = process.env.TELEGRAM_PUBLIC_URL?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN belum diset.");
  process.exit(1);
}
if (!publicUrl) {
  console.error(
    "TELEGRAM_PUBLIC_URL belum diset. Contoh: TELEGRAM_PUBLIC_URL=https://app.example.com",
  );
  process.exit(1);
}

async function call(method, payload = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(`${method}: ${data.description ?? res.status}`);
  }
  return data.result;
}

const webhookUrl = `${publicUrl.replace(/\/$/, "")}/api/telegram/webhook`;

try {
  const me = await call("getMe");
  console.log(`Bot: @${me.username} (${me.id})`);

  await call("setWebhook", {
    url: webhookUrl,
    ...(secret ? { secret_token: secret } : {}),
    allowed_updates: ["message", "edited_message", "callback_query"],
    drop_pending_updates: true,
  });
  console.log(`Webhook diset ke: ${webhookUrl}`);

  await call("setMyCommands", {
    commands: [
      { command: "generate", description: "Buat job video baru" },
      { command: "jobs", description: "Lihat job terbaru" },
      { command: "job", description: "Detail job" },
      { command: "status", description: "Ringkasan dashboard" },
      { command: "posts", description: "Jadwal posting" },
      { command: "ref", description: "Tambah referensi" },
      { command: "id", description: "Lihat chat ID" },
      { command: "help", description: "Bantuan" },
    ],
  });
  console.log("Menu perintah bot diset.");

  const info = await call("getWebhookInfo");
  console.log("Webhook info:", JSON.stringify(info, null, 2));

  if (!process.env.TELEGRAM_CHAT_ID) {
    console.log("\nBelum ada TELEGRAM_CHAT_ID. Kirim /id ke bot, lalu set nilainya.");
  }
} catch (error) {
  console.error("Gagal setup webhook:", error.message);
  process.exit(1);
}
