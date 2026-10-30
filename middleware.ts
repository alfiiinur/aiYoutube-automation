import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySessionValue } from "./app/lib/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/prompts",
  "/generate",
  "/references",
  "/jobs",
  "/automations",
  "/goals",
  "/publish",
  "/schedule",
  "/settings",
];

// API yang boleh diakses tanpa sesi (auth, cron ber-token, webhook, aset publik).
const PUBLIC_API = [
  "/api/auth",
  "/api/cron",
  "/api/telegram",
  "/api/storyboard-image",
  "/api/thumbnail",
  "/api/uploads",
];

const AUTH_PAGES = ["/login", "/register"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const guarded =
    matches(pathname, PROTECTED_PREFIXES) ||
    AUTH_PAGES.includes(pathname) ||
    (isApi && !matches(pathname, PUBLIC_API));
  if (!guarded) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const uid = token ? await verifySessionValue(token, sessionSecret()) : null;

  if (AUTH_PAGES.includes(pathname)) {
    if (!uid) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (uid) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Belum masuk. Silakan login." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/prompts/:path*",
    "/generate/:path*",
    "/references/:path*",
    "/jobs/:path*",
    "/automations/:path*",
    "/goals/:path*",
    "/publish/:path*",
    "/schedule/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};
