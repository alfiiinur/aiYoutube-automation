import type { SocialAccount, SocialPost } from "@/app/types";

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

async function requestJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data;
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
    let postUrl: string | undefined;

    if (post.platform === "threads") {
      const container = await requestJson(
        `https://graph.threads.net/v1.0/${account.userId}/threads`,
        { media_type: "TEXT", text, access_token: account.accessToken },
      );
      if (!container.id) throw new Error("Graph tidak mengembalikan creation_id");
      await requestJson(`https://graph.threads.net/v1.0/${account.userId}/threads_publish`, {
        creation_id: container.id,
        access_token: account.accessToken,
      });
      postUrl = `https://www.threads.net/@${handleOf(account)}/post/${container.id}`;
    } else if (post.platform === "instagram") {
      const container = await requestJson(
        `https://graph.facebook.com/v21.0/${account.userId}/media`,
        { caption: text, access_token: account.accessToken },
      );
      if (!container.id) throw new Error("Graph tidak mengembalikan creation_id");
      await requestJson(`https://graph.facebook.com/v21.0/${account.userId}/media_publish`, {
        creation_id: container.id,
        access_token: account.accessToken,
      });
      postUrl = `https://www.instagram.com/p/${container.id}/`;
    } else {
      const published = await requestJson(`https://graph.facebook.com/v21.0/${account.userId}/feed`, {
        message: text,
        access_token: account.accessToken,
      });
      postUrl = published.id
        ? `https://www.facebook.com/${published.id}`
        : `https://www.facebook.com/${handleOf(account)}`;
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