import { NextResponse } from "next/server";
import { prisma, referenceCreateData, toReference, toSocialPost } from "@/app/lib/db";
import { createJob, syncJobs } from "@/app/lib/jobs";
import { getStats } from "@/app/lib/stats";
import { newId } from "@/app/lib/store";
import { analyzeReference, detectPlatform } from "@/app/lib/reference";
import {
  HELP_TEXT,
  answerCallbackQuery,
  escapeHtml,
  formatJobDetail,
  formatJobLine,
  formatStats,
  isChatAllowed,
  sendChatAction,
  sendTelegramMessage,
  telegramConfigured,
  truncate,
  webUrl,
} from "@/app/lib/telegram";

export const dynamic = "force-dynamic";

type TgMessage = {
  chat: { id: number; type?: string };
  from?: { id: number; username?: string; first_name?: string };
  text?: string;
};

type TgUpdate = {
  message?: TgMessage;
  edited_message?: TgMessage;
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { chat: { id: number } };
  };
};

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!telegramConfigured()) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN belum diset" },
      { status: 503 },
    );
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else await handleMessage(update.message ?? update.edited_message);
  } catch (error) {
    console.error("[telegram] handler error:", error);
  }

  // Telegram hanya butuh 200 OK; balasan dikirim lewat Bot API.
  return NextResponse.json({ ok: true });
}

async function handleMessage(message?: TgMessage) {
  if (!message?.text) return;
  const chatId = message.chat.id;
  const text = message.text.trim();

  if (!isChatAllowed(chatId)) {
    await sendTelegramMessage(
      chatId,
      [
        "⛔ Chat ini belum diizinkan.",
        `Chat ID kamu: <code>${chatId}</code>`,
        "Tambahkan ke <code>TELEGRAM_CHAT_ID</code> (atau <code>TELEGRAM_ALLOWED_CHAT_IDS</code>), lalu restart server.",
      ].join("\n"),
    );
    return;
  }

  if (!text.startsWith("/")) {
    await sendTelegramMessage(chatId, "Ketik /help untuk melihat perintah yang tersedia.");
    return;
  }

  const [raw, ...args] = text.split(/\s+/);
  const command = raw.slice(1).split("@")[0].toLowerCase();

  switch (command) {
    case "start":
    case "help": {
      await sendTelegramMessage(chatId, HELP_TEXT);
      return;
    }

    case "id": {
      await sendTelegramMessage(
        chatId,
        `Chat ID kamu: <code>${chatId}</code>\nUser: ${escapeHtml(
          message.from?.username ? `@${message.from.username}` : message.from?.first_name ?? "-",
        )}`,
      );
      return;
    }

    case "status":
    case "stats": {
      await sendChatAction(chatId);
      await sendTelegramMessage(chatId, formatStats(await getStats()));
      return;
    }

    case "jobs": {
      await sendChatAction(chatId);
      const jobs = (await syncJobs()).slice(0, 6);
      if (jobs.length === 0) {
        await sendTelegramMessage(chatId, "Belum ada job. Coba /generate &lt;prompt&gt;.");
        return;
      }
      const dashboard = webUrl("/jobs");
      await sendTelegramMessage(chatId, "🗂 <b>Job terbaru</b>\nPilih job untuk detail:", {
        reply_markup: {
          inline_keyboard: [
            ...jobs.map((job) => [{ text: formatJobLine(job), callback_data: `job:${job.id}` }]),
            ...(dashboard ? [[{ text: "Buka dashboard", url: dashboard }]] : []),
          ],
        },
      });
      return;
    }

    case "job": {
      await sendChatAction(chatId);
      const jobs = await syncJobs();
      const query = args[0];
      const job = query
        ? jobs.find((j) => j.id === query) ?? jobs.find((j) => j.id.startsWith(query))
        : jobs[0];
      if (!job) {
        await sendTelegramMessage(
          chatId,
          query ? `Job <code>${escapeHtml(query)}</code> tidak ditemukan.` : "Belum ada job.",
        );
        return;
      }
      await sendTelegramMessage(chatId, formatJobDetail(job));
      return;
    }

    case "generate": {
      const { prompt, opts } = parseFlags(args);
      if (prompt.length < 8) {
        await sendTelegramMessage(
          chatId,
          "Prompt minimal 8 karakter.\nContoh:\n<code>/generate video tips memilih mikrofon untuk podcaster pemula</code>",
        );
        return;
      }
      await sendChatAction(chatId);
      const job = await createJob({
        prompt,
        aspectRatio: opts.ratio ?? opts.aspect,
        durationSec: opts.dur || opts.duration ? Number(opts.dur ?? opts.duration) : undefined,
        style: opts.style,
        voice: opts.voice,
        model: opts.model,
      });
      const url = webUrl(`/jobs/${job.id}`);
      await sendTelegramMessage(
        chatId,
        [
          "🎬 <b>Job dibuat</b>",
          `<b>${escapeHtml(job.title || "Tanpa judul")}</b>`,
          `ID: <code>${escapeHtml(job.id)}</code>`,
          `Status: ${job.status} · ${job.progress}%`,
          "",
          "Saya kabari saat render selesai.",
          url ? `Buka: ${escapeHtml(url)}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      return;
    }

    case "ref": {
      const url = args[0];
      if (!url || !/^https?:\/\/\S+$/i.test(url)) {
        await sendTelegramMessage(chatId, "Format: <code>/ref https://youtube.com/watch?v=...</code>");
        return;
      }
      await sendChatAction(chatId);
      const existing = await prisma.referenceSource.findUnique({ where: { url } });
      if (existing) {
        await sendTelegramMessage(
          chatId,
          `ℹ️ Referensi sudah ada:\n<b>${escapeHtml(existing.title)}</b>`,
        );
        return;
      }
      if (detectPlatform(url) === "web" && !url.includes(".")) {
        await sendTelegramMessage(chatId, "Domain tidak dikenali.");
        return;
      }
      const analyzed = await analyzeReference(url);
      const row = await prisma.referenceSource.create({
        data: referenceCreateData({ ...analyzed, id: newId("ref"), createdAt: Date.now() }),
      });
      const ref = toReference(row);
      await sendTelegramMessage(
        chatId,
        [
          "🔗 <b>Referensi ditambahkan</b>",
          `<b>${escapeHtml(ref.title)}</b>`,
          `${escapeHtml(ref.platform)}${ref.author ? ` · ${escapeHtml(ref.author)}` : ""}`,
          ref.insights[0] ? `\n💡 ${escapeHtml(truncate(ref.insights[0], 240))}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      return;
    }

    case "posts": {
      await sendChatAction(chatId);
      const posts = (
        await prisma.socialPost.findMany({ orderBy: { createdAt: "desc" }, take: 6 })
      ).map(toSocialPost);
      if (posts.length === 0) {
        await sendTelegramMessage(chatId, "Belum ada postingan terjadwal.");
        return;
      }
      const lines = posts.map((p) => {
        const icon = p.status === "sent" ? "✅" : p.status === "failed" ? "❌" : "🕒";
        const when = new Date(p.scheduledAt).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        });
        return `${icon} <b>${escapeHtml(truncate(p.jobTitle, 40))}</b>\n   ${escapeHtml(
          p.platform,
        )} · ${when} · ${p.status}`;
      });
      const url = webUrl("/publish");
      await sendTelegramMessage(chatId, ["📮 <b>Jadwal posting</b>", ...lines, url ? `\n🔗 ${escapeHtml(url)}` : ""].join("\n"));
      return;
    }

    default: {
      await sendTelegramMessage(chatId, "Perintah tidak dikenal.\n\n" + HELP_TEXT);
    }
  }
}

async function handleCallback(callback: NonNullable<TgUpdate["callback_query"]>) {
  const chatId = callback.message?.chat.id ?? callback.from.id;
  if (!isChatAllowed(chatId)) {
    await answerCallbackQuery(callback.id, "Chat belum diizinkan");
    return;
  }

  const data = callback.data ?? "";
  if (data.startsWith("job:")) {
    const id = data.slice(4);
    const jobs = await syncJobs();
    const job = jobs.find((j) => j.id === id);
    await answerCallbackQuery(callback.id);
    if (!job) {
      await sendTelegramMessage(chatId, "Job tidak ditemukan (mungkin sudah dihapus).");
      return;
    }
    await sendTelegramMessage(chatId, formatJobDetail(job));
    return;
  }

  await answerCallbackQuery(callback.id, "Aksi tidak dikenal");
}

function parseFlags(tokens: string[]) {
  const opts: Record<string, string> = {};
  const words: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("--")) {
      words.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split("=");
    const key = rawKey.toLowerCase();
    if (inlineValue !== undefined) {
      opts[key] = inlineValue;
    } else if (tokens[i + 1] && !tokens[i + 1].startsWith("--")) {
      opts[key] = tokens[i + 1];
      i += 1;
    } else {
      opts[key] = "true";
    }
  }

  return { prompt: words.join(" ").trim(), opts };
}
