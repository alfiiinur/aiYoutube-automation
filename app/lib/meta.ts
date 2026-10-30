/**
 * Konfigurasi integrasi Meta (Threads, Instagram, Facebook).
 *
 * SERVER-ONLY: memakai META_APP_SECRET. Jangan impor dari komponen client —
 * baca statusnya lewat GET /api/settings.
 *
 * Panduan setup lengkap (buat Meta App, dapat token & user ID):
 * docs/meta-setup.md
 */

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
export const META_THREADS_BASE = "https://graph.threads.net/v1.0";

export interface MetaConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export function metaConfig(): MetaConfig {
  return {
    appId: (process.env.META_APP_ID ?? "").trim(),
    appSecret: (process.env.META_APP_SECRET ?? "").trim(),
    redirectUri: (process.env.META_REDIRECT_URI ?? "").trim(),
  };
}

/** True kalau App ID + App Secret Meta sudah diisi. */
export function isMetaConfigured(): boolean {
  const { appId, appSecret } = metaConfig();
  return appId.length > 0 && appSecret.length > 0;
}

interface GraphErrorBody {
  error?: { message?: string; code?: number; type?: string };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Meta API HTTP ${res.status}`);
  }
  return data;
}

export interface MetaTokenResult {
  accessToken: string;
  /** Detik hingga kedaluwarsa (tidak selalu ada untuk Page token). */
  expiresIn?: number;
}

function toTokenResult(data: { access_token?: string; expires_in?: number }, label: string): MetaTokenResult {
  if (!data.access_token) throw new Error(`Meta tidak mengembalikan access token (${label})`);
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

/**
 * Tukar short-lived user token Facebook/Instagram (~jam) menjadi
 * long-lived token (~60 hari). Dipakai sebelum mengambil Page token.
 */
export async function exchangeFacebookToken(shortToken: string): Promise<MetaTokenResult> {
  const { appId, appSecret } = metaConfig();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
  const data = await getJson<{ access_token?: string; expires_in?: number }>(
    `${META_GRAPH_BASE}/oauth/access_token?${params.toString()}`,
  );
  return toTokenResult(data, "facebook");
}

/**
 * Perpanjang long-lived user token Facebook/Instagram yang masih berlaku
 * (±60 hari lagi). Panggil sebelum token lama kedaluwarsa.
 */
export async function refreshFacebookToken(longToken: string): Promise<MetaTokenResult> {
  return exchangeFacebookToken(longToken);
}

/** Tukar short-lived token Threads menjadi long-lived (~60 hari). */
export async function exchangeThreadsToken(shortToken: string): Promise<MetaTokenResult> {
  const { appSecret } = metaConfig();
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: appSecret,
    access_token: shortToken,
  });
  const data = await getJson<{ access_token?: string; expires_in?: number }>(
    `https://graph.threads.net/oauth/access_token?${params.toString()}`,
  );
  return toTokenResult(data, "threads");
}

/** Perpanjang long-lived token Threads (±60 hari lagi). */
export async function refreshThreadsToken(longToken: string): Promise<MetaTokenResult> {
  const params = new URLSearchParams({ grant_type: "th_refresh_token", access_token: longToken });
  const data = await getJson<{ access_token?: string; expires_in?: number }>(
    `https://graph.threads.net/refresh_access_token?${params.toString()}`,
  );
  return toTokenResult(data, "threads-refresh");
}

export interface ThreadsProfile {
  id: string;
  username?: string;
}

/** Profil Threads milik token — untuk verifikasi token & mengambil user ID. */
export async function fetchThreadsProfile(token: string): Promise<ThreadsProfile> {
  const params = new URLSearchParams({ fields: "id,username", access_token: token });
  return getJson<ThreadsProfile>(`${META_THREADS_BASE}/me?${params.toString()}`);
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: { id: string };
}

/**
 * Daftar Halaman milik token + akun IG Bisnis yang tertaut.
 * Dari sini dapat: Page ID, Page access token, dan IG user ID.
 */
export async function fetchFacebookPages(userToken: string): Promise<FacebookPageInfo[]> {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account",
    access_token: userToken,
  });
  const data = await getJson<{ data?: FacebookPageInfo[] }>(`${META_GRAPH_BASE}/me/accounts?${params.toString()}`);
  return data.data ?? [];
}
