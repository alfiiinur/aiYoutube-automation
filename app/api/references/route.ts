import { NextResponse } from "next/server";
import { prisma, referenceCreateData, toReference } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { analyzeReference, detectPlatform } from "@/app/lib/reference";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.referenceSource.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ references: rows.map(toReference) });
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

  const dup = await prisma.referenceSource.findUnique({ where: { url } });
  if (dup) return NextResponse.json({ reference: toReference(dup), duplicate: true });

  const analyzed = await analyzeReference(url);
  const row = await prisma.referenceSource.create({
    data: referenceCreateData({ ...analyzed, id: newId("ref"), createdAt: Date.now() }),
  });

  return NextResponse.json({ reference: toReference(row) }, { status: 201 });
}
