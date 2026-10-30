// Sesi auth tanpa dependensi tambahan: cookie httpOnly berisi payload
// bertanda tangan HMAC-SHA256. Edge-safe (hanya WebCrypto) agar bisa
// dipakai middleware dan route handler.

export const SESSION_COOKIE = "studio_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

const DEV_SECRET = "dev-only-session-secret-ganti-di-produksi";

export function sessionSecret(): string {
  const s = (process.env.SESSION_SECRET ?? "").trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    console.error("[auth] SESSION_SECRET belum diset — sesi tidak aman.");
  }
  return DEV_SECRET;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(sig));
}

/** Buat nilai cookie sesi untuk userId. */
export async function createSessionValue(userId: string, secret: string): Promise<string> {
  const payload = b64urlEncode(
    new TextEncoder().encode(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_MAX_AGE * 1000 })),
  );
  return `${payload}.${await hmac(payload, secret)}`;
}

/** Verifikasi nilai cookie sesi. Mengembalikan userId atau null. */
export async function verifySessionValue(value: string, secret: string): Promise<string | null> {
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  let expected: string;
  try {
    expected = await hmac(payload, secret);
  } catch {
    return null;
  }
  if (sig.length !== expected.length || sig !== expected) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as {
      uid?: unknown;
      exp?: unknown;
    };
    if (typeof data.uid !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}
