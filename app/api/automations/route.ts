import { NextResponse } from "next/server";
import { prisma, automationCreateData, toAutomation } from "@/app/lib/db";
import { newId } from "@/app/lib/store";
import { AUTOMATION_PLATFORMS, nextRunFromCron } from "@/app/lib/automations";
import type { Automation } from "@/app/types";

export const dynamic = "force-dynamic";

const PRIVACIES: Automation["privacy"][] = ["public", "unlisted", "private"];

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

  const platform = AUTOMATION_PLATFORMS.includes(body.platform as Automation["platform"])
    ? (body.platform as Automation["platform"])
    : "youtube";
  const privacy = PRIVACIES.includes(body.privacy as Automation["privacy"])
    ? (body.privacy as Automation["privacy"])
    : "public";

  const cron = String(body.cron ?? "every:1440");
  const created: Automation = {
    id: newId("auto"),
    name,
    enabled: body.enabled ?? true,
    cron,
    humanSchedule: String(body.humanSchedule ?? "Setiap hari, 09:00"),
    promptTemplate,
    platform,
    privacy,
    runs: 0,
    nextRunAt: nextRunFromCron(cron),
    createdAt: Date.now(),
  };

  const row = await prisma.automation.create({ data: automationCreateData(created) });
  return NextResponse.json({ automation: toAutomation(row) }, { status: 201 });
}
