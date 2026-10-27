import { NextResponse } from "next/server";
import { getDb, mutate, newId } from "@/app/lib/store";
import type { SocialAccount, SocialPlatform } from "@/app/types";

export const dynamic = "force-dynamic";

const PLATFORMS: SocialPlatform[] = ["threads", "instagram", "facebook"];

export async function GET() {
  const db = await getDb();
  const accounts = [...db.socialAccounts].sort((a, b) => a.createdAt - b.createdAt);
  return NextResponse.json({ accounts });
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

  const account = await mutate((db) => {
    const created: SocialAccount = {
      id: newId("soc"),
      platform,
      accountName,
      accessToken: body.accessToken ? String(body.accessToken) : undefined,
      userId: body.userId ? String(body.userId) : undefined,
      enabled: Boolean(body.enabled ?? true),
      createdAt: Date.now(),
    };
    db.socialAccounts.unshift(created);
    return created;
  });

  return NextResponse.json({ account }, { status: 201 });
}