import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionValue,
  sessionSecret,
} from "@/app/lib/session";

export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("Body JSON tidak valid", 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return fail("Email dan password wajib diisi", 400);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail("Email atau password salah", 401);
    }

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set(SESSION_COOKIE, await createSessionValue(user.id, sessionSecret()), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    return fail("Gagal masuk, coba lagi", 500);
  }
}
