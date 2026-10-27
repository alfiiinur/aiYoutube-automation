import { NextResponse } from "next/server";
import { getDb, mutate, newId } from "@/app/lib/store";
import { analyzeReference, detectPlatform } from "@/app/lib/reference";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  return NextResponse.json({
    references: [...db.references].sort((a, b) => b.createdAt - a.createdAt),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = String(body.url ?? "").trim();

  if (!/^https?:\/\/\S+$/i.test(url)) {
    return NextResponse.json({ error: "URL tidak valid (harus diawali http/https)" }, { status: 400 });
  }
  if (detectPlatform(url) === "web" && !url.includes(".")) {
    return NextResponse.json({ error: "Domain tidak dikenali" }, { status: 400 });
  }

  const existing = await getDb();
  const dup = existing.references.find((r) => r.url === url);
  if (dup) return NextResponse.json({ reference: dup, duplicate: true });

  const analyzed = await analyzeReference(url);
  const reference = await mutate((db) => {
    const created = { ...analyzed, id: newId("ref"), createdAt: Date.now() };
    db.references.unshift(created);
    return created;
  });

  return NextResponse.json({ reference }, { status: 201 });
}