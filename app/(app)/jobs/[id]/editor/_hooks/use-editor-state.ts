"use client";

import { useEffect, useRef, useState } from "react";
import type { SideTab } from "@/app/components/editor/SidePanel";
import type {
  EditorProject,
  EditorSelection,
  EditorTool,
  VideoJob,
} from "@/app/types";
import type { Toast } from "../_lib/editor-page-utils";

/** Core shared state + refs + global page effects for the video editor. */
export function useEditorState() {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [project, setProject] = useState<EditorProject | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tool, setTool] = useState<EditorTool>("clip");
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>("chat");
  const [toast, setToast] = useState<Toast | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);

  const projectRef = useRef<EditorProject | null>(null);
  const playheadRef = useRef(0);
  const selectionRef = useRef<EditorSelection | null>(null);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);
  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  /* ---------------- body scroll lock + beforeunload ---------------- */

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  return {
    job,
    setJob,
    project,
    setProject,
    title,
    setTitle,
    loading,
    setLoading,
    error,
    setError,
    dirty,
    setDirty,
    saving,
    setSaving,
    savedAt,
    setSavedAt,
    playhead,
    setPlayhead,
    playing,
    setPlaying,
    tool,
    setTool,
    selection,
    setSelection,
    sideTab,
    setSideTab,
    toast,
    setToast,
    mobilePanel,
    setMobilePanel,
    projectRef,
    playheadRef,
    selectionRef,
  };
}

export type EditorCoreState = ReturnType<typeof useEditorState>;
