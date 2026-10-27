import { NextResponse } from "next/server";
import { getDb, mutate } from "@/app/lib/store";

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

  const account = await mutate((db) => {
    const target = db.socialAccounts.find((a) => a.id === id);
    if (!target) return null;

    if (typeof body.accountName === "string" && body.accountName.trim().length >= 2) {
      target.accountName = body.accountName.trim();
    }
    if (typeof body.accessToken === "string") {
      target.accessToken = body.accessToken || undefined;
    }
    if (typeof body.userId === "string") {
      target.userId = body.userId || undefined;
    }
    if (typeof body.enabled === "boolean") {
      target.enabled = body.enabled;
    }
    return target;
  });

  if (!account) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ account });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await mutate((db) => {
    const idx = db.socialAccounts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    db.socialAccounts.splice(idx, 1);
    return true;
  });
  if (!ok) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}