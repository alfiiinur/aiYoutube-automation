import type { SocialAccount, SocialPost } from "@/app/types";
import { META_GRAPH_BASE, META_THREADS_BASE } from "@/app/lib/meta";

export const PLATFORM_ACCOUNTS: Record<SocialPost["platform"], { label: string; accountCode: string }> = {
  threads: { label: "Threads", accountCode: "threads" },
  instagram: { label: "Instagram", accountCode: "instagram" },
  facebook: { label: "Facebook", accountCode: "facebook" },
};

export function buildPostText(post: Pick<SocialPost, "caption" | "hashtags">) {
  const tags = post.hashtags?.filter(Boolean).join(" ") ?? "";
  return [post.caption?.trim(), tags].filter(Boolean).join("\n\n");
}

function handleOf(account: SocialAccount) {
  const raw = (account.accountName || account.userId || account.platform).replace(/^@/, "");
  return raw.toLowerCase().replace(/[^\w._-]/g, "");
}

export function simulatedPostUrl(post: SocialPost, account?: SocialAccount) {
  const handle = handleOf(account ?? { platform: post.platform } as SocialAccount);
  if (post.platform === "instagram") return `https://www.instagram.com/p/sim-${post.id}/`;
  if (post.platform === "facebook") return `https://www.facebook.com/${handle}/posts/sim-${handle}.${post.id}`;
  return `https://www.threads.net/@${handle}/post/sim-${post.id}`;
}

function hasApiConfig(account: SocialAccount) {
  return Boolean(account.enabled && account.accessToken && account.userId);
}

/* ---------------- media ---------------- */

export type MediaKind = "video" | "image";

const VIDEO_EXTS = new Set(["mp4", "m4v", "mov", "webm", "mkv", "avi"]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

/**
 * Tebak jenis media dari query ?type= (format URL /api/uploads) atau ekstensi file.
 * Mengembalikan null kalau tidak dikenali sebagai video/gambar.
 */
export function mediaKindOf(mediaUrl: string): MediaKind | null {
  const lower = mediaUrl.toLowerCase();
  const typeMatch = /[?&]type=([^&]+)/.exec(lower);
  if (typeMatch) {
    const mime = decodeURIComponent(typeMatch[1]);
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("image/")) return "image";
    return null;
  }
  const path = lower.split("?")[0];
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : "";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (IMAGE_EXTS.has(ext)) return "image";
  return null;
}

/**
 * Graph API hanya mau URL publik absolut. URL relatif /api/uploads/...
 * digabung dengan base URL deployment; query ?type= dibuang karena server
 * sudah bisa menebak MIME dari ekstensi file.
 */
export function absoluteMediaUrl(mediaUrl: string): string | null {
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;
  if (!mediaUrl.startsWith("/")) return null;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.TELEGRAM_PUBLIC_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base) return null;
  return `${base.replace(/\/$/, "")}${mediaUrl.split("?")[0]}`;
}

/* ---------------- graph helpers ---------------- */

async function requestJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; post_id?: string; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data;
}

async function getJson(url: string) {
  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as { status_code?: string; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Tunggu Meta selesai memproses video (bounded agar request tidak menggantung). */
async function waitForMediaReady(source: "threads" | "instagram", containerId: string, token: string) {
  const base = source === "threads" ? META_THREADS_BASE : META_GRAPH_BASE;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await getJson(
      `${base}/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
    );
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error("Meta gagal memproses media. Coba format MP4 (H.264) atau JPG.");
    }
    await sleep(5000);
  }
  throw new Error("Media belum selesai diproses Meta — coba kirim ulang dari daftar postingan.");
}

type ResolvedMedia = { kind: MediaKind; url: string };

async function publishThreads(account: SocialAccount, text: string, media: ResolvedMedia | null) {
  const token = account.accessToken as string;
  const payload: Record<string, unknown> = { access_token: token };
  if (!media) {
    payload.media_type = "TEXT";
    payload.text = text;
  } else if (media.kind === "image") {
    payload.media_type = "IMAGE";
    payload.image_url = media.url;
    if (text) payload.text = text;
  } else {
    payload.media_type = "VIDEO";
    payload.video_url = media.url;
    if (text) payload.text = text;
  }
  const container = await requestJson(`${META_THREADS_BASE}/${account.userId}/threads`, payload);
  if (!container.id) throw new Error("Graph tidak mengembalikan creation_id");
  if (media?.kind === "video") {
    await waitForMediaReady("threads", container.id, token);
  }
  await requestJson(`${META_THREADS_BASE}/${account.userId}/threads_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  return `https://www.threads.net/@${handleOf(account)}/post/${container.id}`;
}

async function publishInstagram(account: SocialAccount, text: string, media: ResolvedMedia | null) {
  const token = account.accessToken as string;
  if (!media) {
    throw new Error("Instagram butuh gambar/video — upload stock video atau pilih job yang punya media.");
  }
  const payload: Record<string, unknown> =
    media.kind === "image"
      ? { image_url: media.url, caption: text, access_token: token }
      : {
          media_type: "REELS",
          video_url: media.url,
          caption: text,
          share_to_feed: true,
          access_token: token,
        };
  const container = await requestJson(`${META_GRAPH_BASE}/${account.userId}/media`, payload);
  if (!container.id) throw new Error("Graph tidak mengembalikan creation_id");
  if (media.kind === "video") {
    await waitForMediaReady("instagram", container.id, token);
  }
  await requestJson(`${META_GRAPH_BASE}/${account.userId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  return `https://www.instagram.com/p/${container.id}/`;
}

async function publishFacebook(account: SocialAccount, text: string, media: ResolvedMedia | null) {
  const token = account.accessToken as string;
  if (!media) {
    const published = await requestJson(`${META_GRAPH_BASE}/${account.userId}/feed`, {
      message: text,
      access_token: token,
    });
    return published.id
      ? `https://www.facebook.com/${published.id}`
      : `https://www.facebook.com/${handleOf(account)}`;
  }
  if (media.kind === "image") {
    const published = await requestJson(`${META_GRAPH_BASE}/${account.userId}/photos`, {
      url: media.url,
      caption: text,
      access_token: token,
    });
    const ref = published.post_id ?? published.id;
    return ref ? `https://www.facebook.com/${ref}` : `https://www.facebook.com/${handleOf(account)}`;
  }
  const published = await requestJson(`${META_GRAPH_BASE}/${account.userId}/videos`, {
    file_url: media.url,
    description: text,
    access_token: token,
  });
  return published.id
    ? `https://www.facebook.com/${published.id}`
    : `https://www.facebook.com/${handleOf(account)}`;
}

/**
 * Publish a post. When the connected account has a real token + user id it
 * will use the official Graph APIs. Otherwise it runs in simulation mode so
 * the scheduling workflow stays fully usable without Meta developer access.
 */
export async function publishPost(
  post: SocialPost,
  account?: SocialAccount,
): Promise<{ ok: boolean; simulated: boolean; postUrl?: string; error?: string }> {
  const text = buildPostText(post);

  if (!account || !hasApiConfig(account)) {
    return {
      ok: true,
      simulated: true,
      postUrl: simulatedPostUrl(post, account),
    };
  }

  try {
    let media: ResolvedMedia | null = null;
    if (post.mediaUrl) {
      const kind = mediaKindOf(post.mediaUrl);
      if (!kind) {
        throw new Error("Jenis media tidak dikenali. Pakai video (MP4/MOV) atau gambar (JPG/PNG).");
      }
      const url = absoluteMediaUrl(post.mediaUrl);
      if (!url) {
        throw new Error("Media butuh URL publik: set NEXT_PUBLIC_APP_URL di .env lalu kirim ulang.");
      }
      media = { kind, url };
    }

    let postUrl: string;
    if (post.platform === "threads") {
      postUrl = await publishThreads(account, text, media);
    } else if (post.platform === "instagram") {
      postUrl = await publishInstagram(account, text, media);
    } else {
      postUrl = await publishFacebook(account, text, media);
    }

    return { ok: true, simulated: false, postUrl };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : "Gagal mempublikasikan postingan",
    };
  }
}

export function shouldPublishNow(scheduledAt: string | number | Date) {
  const time = typeof scheduledAt === "string" || typeof scheduledAt === "number"
    ? new Date(scheduledAt).getTime()
    : scheduledAt.getTime();
  return Number.isFinite(time) && time <= Date.now();
}
