import { NextResponse } from "next/server";
import { prisma, editorJson, jsonValue } from "@/app/lib/db";
import type { EditorProject, VideoJob } from "@/app/types";

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

  const row = await prisma.videoJob.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  const logs = [
    ...((row.logs ?? []) as unknown as VideoJob["logs"]),
    {
      at: now,
      message: `Editor disimpan · ${editor.clips.length} klip · ${editor.captions.length} caption`,
    },
  ].slice(-40);

  await prisma.videoJob.update({
    where: { id },
    data: {
      editor: editorJson(editor),
      logs: jsonValue(logs),
      updatedAt: new Date(now),
      ...(nextTitle ? { title: nextTitle } : {}),
    },
  });

  return NextResponse.json({ editor, savedAt: now });
}
