import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/db";
import { SESSION_COOKIE, sessionSecret, verifySessionValue } from "@/app/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const uid = token ? await verifySessionValue(token, sessionSecret()) : null;
  if (!uid) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error("[auth/me]", e);
    return NextResponse.json({ error: "Gagal memuat sesi" }, { status: 500 });
  }
}
