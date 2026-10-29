import { NextResponse } from "next/server";
import { prisma, socialAccountCreateData, toSocialAccount } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import type { SocialAccount, SocialPlatform } from "@/app/types";

export const dynamic = "force-dynamic";

const PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export async function GET() {
  const rows = await prisma.socialAccount.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ accounts: rows.map(toSocialAccount) });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const platform = String(body.platform ?? "") as SocialPlatform;
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Platform tidak valid" }, { status: 400 });
  }

  const accountName = String(body.accountName ?? "").trim();
  if (accountName.length < 2) {
    return NextResponse.json({ error: "Nama akun minimal 2 karakter" }, { status: 400 });
  }

  const created: SocialAccount = {
    id: newId("soc"),
    platform,
    accountName,
    accessToken: body.accessToken ? String(body.accessToken) : undefined,
    userId: body.userId ? String(body.userId) : undefined,
    enabled: Boolean(body.enabled ?? true),
    createdAt: Date.now(),
  };

  const row = await prisma.socialAccount.create({ data: socialAccountCreateData(created) });
  return NextResponse.json({ account: toSocialAccount(row) }, { status: 201 });
}
