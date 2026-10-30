"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runEditorCommand, uid } from "@/app/lib/editor";
import type { EditorProject } from "@/app/types";
import type { EditorCoreState } from "./use-editor-state";
import type { EditorMutations } from "./use-editor-mutate";

type ChatDeps = Pick<
  EditorCoreState,
  | "projectRef"
  | "playheadRef"
  | "selectionRef"
  | "setProject"
  | "setDirty"
  | "setSelection"
  | "setTool"
> &
  Pick<EditorMutations, "fitDuration"> & { id: string };

/** AI chat commands that mutate the project. */
export function useEditorChat(deps: ChatDeps) {
  const {
    id,
    projectRef,
    playheadRef,
    selectionRef,
    setProject,
    setDirty,
    setSelection,
    setTool,
    fitDuration,
  } = deps;

  const [thinking, setThinking] = useState(false);
  const chatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (chatTimer.current) clearTimeout(chatTimer.current);
    };
  }, [id]);

  const sendChat = useCallback(
    (text: string) => {
      const current = projectRef.current;
      if (!current) return;
      const userMessage = { id: uid("msg"), role: "user" as const, text, at: Date.now() };
      const withUser: EditorProject = {
        ...current,
        chat: [...current.chat, userMessage],
        updatedAt: Date.now(),
      };
      projectRef.current = withUser;
      setProject(withUser);
      setDirty(true);
      setThinking(true);

      chatTimer.current = setTimeout(() => {
        const base = projectRef.current;
        if (!base) {
          setThinking(false);
          return;
        }
        const result = runEditorCommand(text, base, {
          playhead: playheadRef.current,
          selection: selectionRef.current,
        });
        const assistant = {
          id: uid("msg"),
          role: "assistant" as const,
          text: result.reply,
          at: Date.now(),
        };
        const next = fitDuration({
          ...result.project,
          chat: [...result.project.chat, assistant],
          updatedAt: Date.now(),
        });
        projectRef.current = next;
        setProject(next);
        setDirty(true);
        setThinking(false);
        if (result.select) {
          setSelection(result.select);
          if (result.select.track === "caption") setTool("caption");
          else if (result.select.track === "overlay") setTool("overlay");
          else setTool("clip");
        }
      }, 550);
    },
    [fitDuration, projectRef, playheadRef, selectionRef, setProject, setDirty, setSelection, setTool],
  );

  return { thinking, sendChat };
}
