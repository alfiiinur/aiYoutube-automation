import type { Prisma } from "@prisma/client";
import type { GoalChat, GoalChatMessage, GoalChatSnapshot } from "@/app/types";

const STEPS = ["category", "outcome", "target", "deadline", "confirm", "done"];

export function sanitizeSnapshot(value: unknown): GoalChatSnapshot {
  const v = (value ?? {}) as Partial<GoalChatSnapshot>;
  const dc = (v.deadlineChoice ?? null) as GoalChatSnapshot["deadlineChoice"];
  return {
    categoryId: typeof v.categoryId === "string" ? v.categoryId.slice(0, 40) : null,
    customStart: v.customStart === true,
    outcome: typeof v.outcome === "string" ? v.outcome.slice(0, 120) : null,
    goalTarget:
      typeof v.goalTarget === "number" && Number.isInteger(v.goalTarget) ? v.goalTarget : null,
    deadlineChoice:
      dc && typeof dc === "object"
        ? {
            id: String(dc.id ?? "").slice(0, 40),
            label: String(dc.label ?? "").slice(0, 80),
            ...(typeof dc.iso === "string" ? { iso: dc.iso.slice(0, 40) } : {}),
            ...(typeof dc.dateLabel === "string" ? { dateLabel: dc.dateLabel.slice(0, 80) } : {}),
          }
        : null,
    step: typeof v.step === "string" && STEPS.includes(v.step) ? v.step : "category",
  };
}

export function sanitizeTranscript(value: unknown): GoalChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 60).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const e = entry as Partial<GoalChatMessage>;
    const text = String(e.text ?? "").trim().slice(0, 2000);
    if ((e.role !== "user" && e.role !== "assistant") || !text) return [];
    const at = typeof e.at === "number" && Number.isFinite(e.at) ? e.at : Date.now();
    return [{ role: e.role, text, at }];
  });
}

type ChatRow = Prisma.GoalChatGetPayload<object>;

export function toGoalChat(row: ChatRow): GoalChat {
  return {
    id: row.id,
    title: row.title,
    snapshot: sanitizeSnapshot(row.snapshot),
    transcript: sanitizeTranscript(row.transcript),
    goalId: row.goalId ?? undefined,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}
