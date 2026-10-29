import { NextResponse } from "next/server";
import { prisma, automationCreateData, toAutomation } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import type { Automation } from "@/app/types";

export const dynamic = "force-dynamic";

function nextRunFromNow(cron: string): number {
  const hours = cron.match(/^\d+\s+(\d+)/);
  const every = cron.startsWith("every:");
  if (every) {
    const minutes = Number(cron.split(":")[1]) || 60;
    return Date.now() + minutes * 60_000;
  }
  if (hours) {
    const h = Number(hours[1]) || 9;
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  return Date.now() + 24 * 3600_000;
}

export async function GET() {
  const rows = await prisma.automation.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ automations: rows.map(toAutomation) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Automation>;
  const name = String(body.name ?? "").trim();
  const promptTemplate = String(body.promptTemplate ?? "").trim();
  if (!name || promptTemplate.length < 8) {
    return NextResponse.json({ error: "Nama dan template prompt wajib diisi" }, { status: 400 });
  }

  const cron = String(body.cron ?? "every:1440");
  const created: Automation = {
    id: newId("auto"),
    name,
    enabled: body.enabled ?? true,
    cron,
    humanSchedule: String(body.humanSchedule ?? "Setiap hari, 09:00"),
    promptTemplate,
    platform: body.platform ?? "youtube",
    privacy: body.privacy ?? "public",
    runs: 0,
    nextRunAt: nextRunFromNow(cron),
    createdAt: Date.now(),
  };

  const row = await prisma.automation.create({ data: automationCreateData(created) });
  return NextResponse.json({ automation: toAutomation(row) }, { status: 201 });
}
