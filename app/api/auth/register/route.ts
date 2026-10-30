import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { hashPassword } from "@/app/lib/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionValue,
  sessionSecret,
} from "@/app/lib/session";
import { newId } from "@/app/lib/store";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const name = String(body.name ?? "").trim().slice(0, 60);
  const password = String(body.password ?? "");

  if (!EMAIL_RE.test(email)) return fail("Email tidak valid", 400);
  if (password.length < 8) return fail("Password minimal 8 karakter", 400);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail("Email sudah terdaftar, silakan masuk", 409);

    const user = await prisma.user.create({
      data: {
        id: newId("usr"),
        email,
        name: name || null,
        passwordHash: await hashPassword(password),
      },
    });

    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 },
    );
    res.cookies.set(SESSION_COOKIE, await createSessionValue(user.id, sessionSecret()), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("[auth/register]", e);
    return fail("Gagal mendaftar, coba lagi", 500);
  }
}
