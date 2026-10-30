"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_CLIP, clamp, reflowClips, uid } from "@/app/lib/editor";
import type { EditorClip, EditorMedia } from "@/app/types";
import { fileNameTitle, probeMediaDuration } from "../_lib/editor-page-utils";
import type { EditorCoreState } from "./use-editor-state";
import type { EditorMutations } from "./use-editor-mutate";

type ImportDeps = Pick<
  EditorCoreState,
  | "projectRef"
  | "setSelection"
  | "setTool"
  | "setPlayhead"
  | "setSideTab"
  | "setToast"
> &
  Pick<EditorMutations, "applyProject">;

/** Media import (upload + append clips / music). */
export function useEditorImport(deps: ImportDeps) {
  const { projectRef, setSelection, setTool, setPlayhead, setSideTab, setToast, applyProject } =
    deps;

  const importInputRef = useRef<HTMLInputElement>(null);
  const importBusyRef = useRef(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const all = Array.from(files);
      const list = all.filter(
        (file) =>
          /^(video|image|audio)\//.test(file.type) ||
          /\.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|aac|ogg|flac|png|jpe?g|webp|gif|avif)$/i.test(file.name),
      );
      if (list.length === 0) {
        setToast({
          text: "File tidak didukung. Impor video, gambar, atau audio (MP4/MP3/PNG/JPG).",
          tone: "error",
        });
        return;
      }
      if (importBusyRef.current) return;
      importBusyRef.current = true;
      setImporting(true);
      try {
        const uploaded: { asset: EditorMedia; duration: number }[] = [];
        for (const file of list) {
          const duration = await probeMediaDuration(file);
          const body = new FormData();
          body.append("file", file);
          const res = await fetch("/api/uploads", { method: "POST", body });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `Gagal mengimpor ${file.name}`);
          uploaded.push({ asset: data.asset as EditorMedia, duration });
        }

        const current = projectRef.current;
        if (!current) return;

        let firstClipId: string | null = null;
        let firstClipStart = 0;
        let sceneIndex = current.clips.reduce((max, clip) => Math.max(max, clip.sceneIndex), 0);
        let clips = [...current.clips];
        let music = current.music;

        for (const { asset, duration } of uploaded) {
          if (asset.kind === "audio") {
            music = {
              ...music,
              title: fileNameTitle(asset.name),
              prompt: `Audio impor: ${asset.name}`,
              style: "imported audio",
              exclude: "-",
              description: `Track musik dari file ${asset.name}.`,
              file: asset,
              volume: music.volume || 72,
            };
            continue;
          }

          const length = asset.kind === "image" ? 3.5 : clamp(duration, 1, MAX_CLIP);
          const start = clips.length > 0 ? clips[clips.length - 1].end : 0;
          sceneIndex += 1;
          const clip: EditorClip = {
            id: uid("clip"),
            sceneIndex,
            start,
            end: start + length,
            title: fileNameTitle(asset.name),
            visual: asset.kind === "video" ? `Video impor: ${asset.name}` : `Gambar impor: ${asset.name}`,
            broll: asset.kind === "video" ? "video" : "gambar",
            media: asset,
          };
          if (!firstClipId) {
            firstClipId = clip.id;
            firstClipStart = start;
          }
          clips.push(clip);
        }

        applyProject({ ...current, clips: reflowClips(clips), music });

        if (firstClipId) {
          setSelection({ track: "clip", id: firstClipId });
          setTool("clip");
          setPlayhead(firstClipStart);
        } else {
          setSelection({ track: "music", id: "music" });
          setTool("music");
        }
        setSideTab("props");

        const visualCount = uploaded.filter((u) => u.asset.kind !== "audio").length;
        const audioCount = uploaded.length - visualCount;
        const parts = [
          visualCount > 0 ? `${visualCount} media` : null,
          audioCount > 0 ? `${audioCount} audio` : null,
        ].filter(Boolean);
        setToast({ text: `${parts.join(" + ")} diimpor ke timeline`, tone: "ok" });
      } catch (e) {
        setToast({ text: e instanceof Error ? e.message : "Gagal mengimpor media", tone: "error" });
      } finally {
        setImporting(false);
        importBusyRef.current = false;
        if (importInputRef.current) importInputRef.current.value = "";
      }
    },
    [applyProject, projectRef, setSelection, setTool, setPlayhead, setSideTab, setToast],
  );

  return { importInputRef, importing, dragActive, setDragActive, importFiles };
}
