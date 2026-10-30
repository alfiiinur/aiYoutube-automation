"use client";

import { useCallback } from "react";
import { MIN_CLIP, MUSIC_PRESETS, clamp, uid } from "@/app/lib/editor";
import type {
  EditorCaption,
  EditorMusic,
  EditorOverlay,
  EditorTool,
} from "@/app/types";
import type { EditorCoreState } from "./use-editor-state";
import type { EditorMutations } from "./use-editor-mutate";

type PropsDeps = Pick<
  EditorCoreState,
  | "project"
  | "playhead"
  | "setSelection"
  | "setTool"
  | "setSideTab"
  | "setToast"
> &
  Pick<EditorMutations, "mutateProject">;

/** Caption / overlay / music / voice property edits + tool switching. */
export function useEditorProps(deps: PropsDeps) {
  const { project, playhead, setSelection, setTool, setSideTab, setToast, mutateProject } = deps;

  const updateCaption = useCallback(
    (captionId: string, patch: Partial<EditorCaption>) => {
      mutateProject((p) => {
        const index = p.captions.findIndex((c) => c.id === captionId);
        if (index < 0) return p;
        const current = p.captions[index];
        const prevEnd = index > 0 ? p.captions[index - 1].end : 0;
        const nextStart = index + 1 < p.captions.length ? p.captions[index + 1].start : p.duration;

        let start = current.start;
        let end = current.end;
        if (patch.start !== undefined || patch.end !== undefined) {
          const requestedLength =
            patch.start !== undefined && patch.end !== undefined
              ? patch.end - patch.start
              : patch.end !== undefined
                ? patch.end - current.start
                : current.end - (patch.start as number);
          const available = Math.max(MIN_CLIP, nextStart - prevEnd);
          const length = clamp(requestedLength, MIN_CLIP, available);
          start = clamp(
            patch.start ?? current.start,
            prevEnd,
            Math.max(prevEnd, nextStart - length),
          );
          end = clamp(start + length, start + MIN_CLIP, nextStart);
        }

        const captions = p.captions.map((c, i) =>
          i === index ? { ...c, ...patch, start, end } : c,
        );
        return { ...p, captions };
      });
    },
    [mutateProject],
  );

  const updateOverlay = useCallback(
    (overlayId: string, patch: Partial<EditorOverlay>) => {
      mutateProject((p) => ({
        ...p,
        overlays: p.overlays.map((o) => {
          if (o.id !== overlayId) return o;
          const next = { ...o, ...patch };
          next.start = clamp(next.start, 0, Math.max(0, p.duration - 0.4));
          next.end = clamp(next.end, next.start + 0.4, p.duration);
          return next;
        }),
      }));
    },
    [mutateProject],
  );

  const updateMusic = useCallback(
    (patch: Partial<EditorMusic>) => {
      mutateProject((p) => ({ ...p, music: { ...p.music, ...patch } }));
    },
    [mutateProject],
  );

  const updateVoiceVolume = useCallback(
    (value: number) => {
      mutateProject((p) => ({ ...p, voiceVolume: clamp(value, 0, 100) }));
    },
    [mutateProject],
  );

  const applyMusicPreset = useCallback(
    (key: keyof typeof MUSIC_PRESETS) => {
      const preset = MUSIC_PRESETS[key];
      mutateProject((p) => ({ ...p, music: { ...preset, volume: p.music.volume || 72, file: undefined } }));
      setToast({ text: `Musik diganti ke “${preset.title}”`, tone: "ok" });
    },
    [mutateProject, setToast],
  );

  const generateMusic = useCallback(() => {
    if (!project) return;
    const keys = Object.keys(MUSIC_PRESETS) as (keyof typeof MUSIC_PRESETS)[];
    const current = keys.findIndex((k) => MUSIC_PRESETS[k].style === project.music.style);
    const next = keys[(current + 1 + keys.length) % keys.length];
    applyMusicPreset(next);
  }, [project, applyMusicPreset]);

  const toggleCaptions = useCallback(() => {
    mutateProject((p) => ({ ...p, captionsEnabled: !p.captionsEnabled }));
  }, [mutateProject]);

  const addOverlay = useCallback(() => {
    if (!project) return;
    const start = clamp(playhead, 0, Math.max(0, project.duration - 1));
    const end = clamp(start + 4, start + 1, project.duration);
    const overlay: EditorOverlay = {
      id: uid("ov"),
      start,
      end,
      text: "Teks overlay baru",
      variant: "title",
    };
    mutateProject((p) => ({ ...p, overlays: [...p.overlays, overlay] }));
    setSelection({ track: "overlay", id: overlay.id });
    setTool("overlay");
    setSideTab("props");
    setToast({ text: "Overlay ditambahkan di playhead", tone: "ok" });
  }, [project, playhead, mutateProject, setSelection, setTool, setSideTab, setToast]);

  const chooseTool = useCallback(
    (next: EditorTool) => {
      setTool(next);
      if (!project) return;
      if (next === "voice") {
        setSelection(null);
        setSideTab("props");
        return;
      }
      setSideTab("props");
      if (next === "music") {
        setSelection({ track: "music", id: "music" });
        return;
      }
      if (next === "overlay") {
        setSelection(null);
        return;
      }
      if (next === "caption") {
        const active = project.captions.find((c) => playhead >= c.start && playhead < c.end) ?? project.captions[0];
        if (active) setSelection({ track: "caption", id: active.id });
        return;
      }
      const active = project.clips.find((c) => playhead >= c.start && playhead < c.end) ?? project.clips[0];
      if (active) setSelection({ track: "clip", id: active.id });
    },
    [project, playhead, setTool, setSelection, setSideTab],
  );

  return {
    updateCaption,
    updateOverlay,
    updateMusic,
    updateVoiceVolume,
    applyMusicPreset,
    generateMusic,
    toggleCaptions,
    addOverlay,
    chooseTool,
  };
}
