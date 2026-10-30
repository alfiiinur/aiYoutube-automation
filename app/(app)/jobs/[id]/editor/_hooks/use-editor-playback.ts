"use client";

import { useCallback, useEffect } from "react";
import type { EditorCoreState } from "./use-editor-state";

type PlaybackDeps = Pick<
  EditorCoreState,
  "project" | "job" | "playhead" | "setPlayhead" | "playing" | "setPlaying"
>;

/** Playback clock + transport controls. */
export function useEditorPlayback(deps: PlaybackDeps) {
  const { project, job, playhead, setPlayhead, playing, setPlaying } = deps;

  const duration = project?.duration ?? job?.durationSec ?? 0;

  useEffect(() => {
    setPlayhead((prev) => Math.min(prev, duration));
  }, [duration, setPlayhead]);

  useEffect(() => {
    if (!playing || !project) return;
    const t = setInterval(() => {
      setPlayhead((prev) => Math.min(project.duration, prev + 0.1));
    }, 100);
    return () => clearInterval(t);
  }, [playing, project, setPlayhead]);

  useEffect(() => {
    if (playing && project && playhead >= project.duration) setPlaying(false);
  }, [playing, project, playhead, setPlaying]);

  const togglePlay = useCallback(() => {
    if (!project) return;
    if (playhead >= project.duration - 0.05) setPlayhead(0);
    setPlaying((p) => !p);
  }, [project, playhead, setPlayhead, setPlaying]);

  const prevClip = useCallback(() => {
    if (!project) return;
    const starts = project.clips.map((c) => c.start).sort((a, b) => a - b);
    const previous = starts.filter((s) => s < playhead - 0.2).pop();
    setPlayhead(previous ?? 0);
  }, [project, playhead, setPlayhead]);

  const nextClip = useCallback(() => {
    if (!project) return;
    const starts = project.clips.map((c) => c.start).sort((a, b) => a - b);
    const next = starts.find((s) => s > playhead + 0.2);
    setPlayhead(next ?? project.duration);
  }, [project, playhead, setPlayhead]);

  return { duration, togglePlay, prevClip, nextClip };
}
