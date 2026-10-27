import { NextResponse } from "next/server";
import { mutate } from "@/app/lib/store";
import type { EditorProject } from "@/app/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isEditorPayload(value: unknown): value is EditorProject {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<EditorProject>;
  return (
    Array.isArray(v.clips) &&
    Array.isArray(v.captions) &&
    Array.isArray(v.overlays) &&
    Array.isArray(v.chat) &&
    !!v.music &&
    typeof v.music === "object"
  );
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  let body: { editor?: unknown; title?: unknown };
  try {
    body = (await req.json()) as { editor?: unknown; title?: unknown };
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const rawEditor = body.editor;
  if (!isEditorPayload(rawEditor)) {
    return NextResponse.json({ error: "Data editor tidak valid" }, { status: 400 });
  }

  const nextTitle = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const now = Date.now();
  const editor: EditorProject = {
    ...rawEditor,
    version: 1,
    chat: rawEditor.chat
      .slice(-40)
      .map((m) => ({ ...m, text: String(m.text ?? "").slice(0, 2000) })),
    updatedAt: now,
  };

  const saved = await mutate((db) => {
    const job = db.jobs.find((j) => j.id === id);
    if (!job) return null;
    job.editor = editor;
    if (nextTitle) job.title = nextTitle;
    job.updatedAt = now;
    job.logs = [
      ...job.logs,
      { at: now, message: `Editor disimpan · ${editor.clips.length} klip · ${editor.captions.length} caption` },
    ].slice(-40);
    return editor;
  });

  if (!saved) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ editor: saved, savedAt: now });
}
