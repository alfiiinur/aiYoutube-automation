import { NextResponse } from "next/server";
import { prisma, toSocialAccount } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const row = await prisma.socialAccount.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const updated = await prisma.socialAccount.update({
    where: { id },
    data: {
      ...(typeof body.accountName === "string" && body.accountName.trim().length >= 2
        ? { accountName: body.accountName.trim() }
        : {}),
      ...(typeof body.accessToken === "string"
        ? { accessToken: body.accessToken || null }
        : {}),
      ...(typeof body.userId === "string" ? { userId: body.userId || null } : {}),
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
    },
  });

  return NextResponse.json({ account: toSocialAccount(updated) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { count } = await prisma.socialAccount.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
