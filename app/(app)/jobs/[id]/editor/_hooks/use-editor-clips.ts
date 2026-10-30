"use client";

import { useCallback } from "react";
import {
  MAX_CLIP,
  MIN_CLIP,
  clamp,
  reflowClips,
  removeEditorItem,
  splitEditorItem,
} from "@/app/lib/editor";
import type { EditorClip } from "@/app/types";
import type { EditorCoreState } from "./use-editor-state";
import type { EditorMutations } from "./use-editor-mutate";

type ClipsDeps = Pick<
  EditorCoreState,
  "project" | "selection" | "playhead" | "setSelection" | "setToast"
> &
  Pick<EditorMutations, "mutateProject" | "applyProject">;

/** Clip timeline operations: edit, trim, reorder, split, delete. */
export function useEditorClips(deps: ClipsDeps) {
  const { project, selection, playhead, setSelection, setToast, mutateProject, applyProject } =
    deps;

  const updateClip = useCallback(
    (clipId: string, patch: Partial<EditorClip>) => {
      mutateProject((p) => {
        const clips = p.clips.map((c) => {
          if (c.id !== clipId) return c;
          const oldLength = c.end - c.start;
          let length = oldLength;
          if (patch.start !== undefined && patch.end !== undefined) length = patch.end - patch.start;
          else if (patch.start !== undefined) length = oldLength - (patch.start - c.start);
          else if (patch.end !== undefined) length = patch.end - c.start;
          return {
            ...c,
            ...patch,
            start: c.start,
            end: c.start + clamp(length, MIN_CLIP, MAX_CLIP),
          };
        });
        return { ...p, clips: reflowClips(clips) };
      });
    },
    [mutateProject],
  );

  const trimClip = useCallback(
    (clipId: string, edge: "start" | "end", time: number) => {
      mutateProject((p) => {
        const index = p.clips.findIndex((c) => c.id === clipId);
        if (index < 0) return p;

        if (edge === "start") {
          if (index === 0) return p;
          const previous = p.clips[index - 1];
          const current = p.clips[index];
          const boundary = clamp(time, previous.start + MIN_CLIP, current.end - MIN_CLIP);
          const clips = p.clips.map((c, i) => {
            if (i === index - 1) return { ...c, end: boundary };
            if (i === index) return { ...c, start: boundary };
            return c;
          });
          return { ...p, clips: reflowClips(clips) };
        }

        const current = p.clips[index];
        const length = clamp(time - current.start, MIN_CLIP, MAX_CLIP);
        const clips = p.clips.map((c) => (c.id === clipId ? { ...c, end: c.start + length } : c));
        return { ...p, clips: reflowClips(clips) };
      });
    },
    [mutateProject],
  );

  const reorderClips = useCallback(
    (clipId: string, toIndex: number) => {
      mutateProject((p) => {
        const from = p.clips.findIndex((c) => c.id === clipId);
        if (from < 0) return p;
        const next = p.clips.filter((c) => c.id !== clipId);
        next.splice(clamp(toIndex, 0, next.length), 0, p.clips[from]);
        return { ...p, clips: reflowClips(next) };
      });
    },
    [mutateProject],
  );

  const splitSelected = useCallback(() => {
    if (!project) return;
    const result = splitEditorItem(project, selection, playhead);
    if (result.changed) applyProject(result.project);
    setToast({ text: result.reply, tone: result.changed ? "ok" : "info" });
  }, [project, selection, playhead, applyProject, setToast]);

  const removeSelected = useCallback(() => {
    if (!project) return;
    const result = removeEditorItem(project, selection);
    if (result.changed) {
      applyProject(result.project);
      setSelection(null);
    }
    setToast({ text: result.reply, tone: result.changed ? "ok" : "info" });
  }, [project, selection, applyProject, setSelection, setToast]);

  return { updateClip, trimClip, reorderClips, splitSelected, removeSelected };
}
