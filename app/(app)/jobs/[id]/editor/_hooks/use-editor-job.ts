"use client";

import { useCallback, useEffect, useMemo } from "react";
import { normalizeProject } from "@/app/lib/editor";
import type { VideoJob } from "@/app/types";
import type { EditorCoreState } from "./use-editor-state";

/** Load job/project, persist edits, and title handling. */
export function useEditorJob(id: string, s: EditorCoreState) {
  const {
    title,
    saving,
    projectRef,
    setJob,
    setProject,
    setTitle,
    setLoading,
    setError,
    setDirty,
    setSaving,
    setSavedAt,
    setToast,
  } = s;

  /* ---------------- load ---------------- */

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Job tidak ditemukan");
        if (!alive) return;
        const loaded = data.job as VideoJob;
        setJob(loaded);
        setTitle(loaded.title);
        setProject(normalizeProject(loaded.editor, loaded));
        setSavedAt(loaded.editor?.updatedAt ?? null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Gagal membuka editor");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, setJob, setTitle, setProject, setSavedAt, setError, setLoading]);

  /* ---------------- save ---------------- */

  const save = useCallback(async () => {
    const current = projectRef.current;
    if (!current || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${id}/editor`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editor: current, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan editor");
      setProject((prev) => (prev ? { ...prev, updatedAt: data.savedAt } : prev));
      setJob((prev) => (prev ? { ...prev, title, editor: data.editor } : prev));
      setDirty(false);
      setSavedAt(data.savedAt);
      setToast({ text: "Editor tersimpan", tone: "ok" });
    } catch (e) {
      setToast({ text: e instanceof Error ? e.message : "Gagal menyimpan editor", tone: "error" });
    } finally {
      setSaving(false);
    }
  }, [id, title, saving, projectRef, setSaving, setProject, setJob, setDirty, setSavedAt, setToast]);

  const updateTitle = useCallback(
    (value: string) => {
      setTitle(value);
      setDirty(true);
    },
    [setTitle, setDirty],
  );

  const steps = useMemo(
    () => [
      { label: "Ide cerita", href: `/jobs/${id}` },
      { label: "Naskah", href: `/jobs/${id}#script` },
      { label: "Storyboard", href: `/jobs/${id}#storyboard` },
    ],
    [id],
  );

  return { save, updateTitle, steps };
}
