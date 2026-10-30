"use client";

import { useCallback } from "react";
import { clipsEnd } from "@/app/lib/editor";
import type { EditorProject } from "@/app/types";
import type { EditorCoreState } from "./use-editor-state";

/** Low-level project mutation primitives (duration fitting + dirty tracking). */
export function useEditorMutations(s: EditorCoreState) {
  const { job, projectRef, setProject, setDirty } = s;

  const fitDuration = useCallback(
    (p: EditorProject): EditorProject => {
      const base = job?.durationSec ?? 5;
      const end = Math.max(
        base,
        clipsEnd(p.clips),
        ...p.captions.map((c) => c.end),
        ...p.overlays.map((o) => o.end),
      );
      return Math.abs(p.duration - end) < 0.005 ? p : { ...p, duration: end };
    },
    [job?.durationSec],
  );

  const applyProject = useCallback(
    (next: EditorProject) => {
      const fitted = fitDuration(next);
      projectRef.current = fitted;
      setProject(fitted);
      setDirty(true);
    },
    [fitDuration, projectRef, setProject, setDirty],
  );

  const mutateProject = useCallback(
    (fn: (p: EditorProject) => EditorProject) => {
      setProject((prev) => {
        if (!prev) return prev;
        const next = { ...fitDuration(fn(prev)), updatedAt: Date.now() };
        projectRef.current = next;
        return next;
      });
      setDirty(true);
    },
    [fitDuration, projectRef, setProject, setDirty],
  );

  return { fitDuration, applyProject, mutateProject };
}

export type EditorMutations = ReturnType<typeof useEditorMutations>;
