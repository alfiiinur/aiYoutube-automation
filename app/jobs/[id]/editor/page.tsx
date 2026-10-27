"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Download,
  Layers,
  Loader2,
  MessageSquare,
  Mic2,
  Music2,
  PenLine,
  Save,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import PreviewStage from "@/app/components/editor/PreviewStage";
import SidePanel, { type SideTab } from "@/app/components/editor/SidePanel";
import Timeline from "@/app/components/editor/Timeline";
import {
  MAX_CLIP,
  MIN_CLIP,
  MUSIC_PRESETS,
  clamp,
  clipsEnd,
  normalizeProject,
  reflowClips,
  removeEditorItem,
  runEditorCommand,
  splitEditorItem,
  uid,
} from "@/app/lib/editor";
import type {
  EditorCaption,
  EditorClip,
  EditorMedia,
  EditorMusic,
  EditorOverlay,
  EditorProject,
  EditorSelection,
  EditorTool,
  VideoJob,
} from "@/app/types";

const TOOL_ITEMS: { id: EditorTool; label: string; icon: typeof Clapperboard }[] = [
  { id: "clip", label: "Klip", icon: Clapperboard },
  { id: "voice", label: "Suara", icon: Mic2 },
  { id: "caption", label: "Caption", icon: Type },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "music", label: "Musik", icon: Music2 },
];

type Toast = { text: string; tone: "ok" | "error" | "info" };

function showToastStyle(tone: Toast["tone"]) {
  if (tone === "error") return "border-brand-500/40 bg-[#1b0a10]/95 text-brand-400";
  if (tone === "ok") return "border-lime-500/30 bg-[#0e170c]/95 text-lime-300";
  return "border-white/12 bg-ink-900/95 text-white/75";
}

function fileNameTitle(name: string): string {
  return name.replace(/\.[^.]+$/, "").slice(0, 42) || "Media impor";
}

/** Read video/audio duration locally before uploading, so the new clip gets a real length. */
function probeMediaDuration(file: File): Promise<number> {
  if (file.type.startsWith("image/")) return Promise.resolve(3.5);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (value: number) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      URL.revokeObjectURL(url);
      el.removeAttribute("src");
      el.load();
      resolve(value);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => finish(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 5);
    el.onerror = () => finish(5);
    el.src = url;
    timer = setTimeout(() => finish(5), 8000);
  });
}

export default function VideoEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

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
  const [thinking, setThinking] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);

  const projectRef = useRef<EditorProject | null>(null);
  const playheadRef = useRef(0);
  const selectionRef = useRef<EditorSelection | null>(null);
  const chatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importBusyRef = useRef(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);
  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

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
      if (chatTimer.current) clearTimeout(chatTimer.current);
    };
  }, [id]);

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

  /* ---------------- playback ---------------- */

  const duration = project?.duration ?? job?.durationSec ?? 0;

  useEffect(() => {
    setPlayhead((prev) => Math.min(prev, duration));
  }, [duration]);

  useEffect(() => {
    if (!playing || !project) return;
    const t = setInterval(() => {
      setPlayhead((prev) => Math.min(project.duration, prev + 0.1));
    }, 100);
    return () => clearInterval(t);
  }, [playing, project]);

  useEffect(() => {
    if (playing && project && playhead >= project.duration) setPlaying(false);
  }, [playing, project, playhead]);

  const togglePlay = useCallback(() => {
    if (!project) return;
    if (playhead >= project.duration - 0.05) setPlayhead(0);
    setPlaying((p) => !p);
  }, [project, playhead]);

  const prevClip = useCallback(() => {
    if (!project) return;
    const starts = project.clips.map((c) => c.start).sort((a, b) => a - b);
    const previous = starts.filter((s) => s < playhead - 0.2).pop();
    setPlayhead(previous ?? 0);
  }, [project, playhead]);

  const nextClip = useCallback(() => {
    if (!project) return;
    const starts = project.clips.map((c) => c.start).sort((a, b) => a - b);
    const next = starts.find((s) => s > playhead + 0.2);
    setPlayhead(next ?? project.duration);
  }, [project, playhead]);

  /* ---------------- project mutations ---------------- */

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
    [fitDuration],
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
    [fitDuration],
  );

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
    [applyProject],
  );

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
    [mutateProject],
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
  }, [project, playhead, mutateProject]);

  const splitSelected = useCallback(() => {
    if (!project) return;
    const result = splitEditorItem(project, selection, playhead);
    if (result.changed) applyProject(result.project);
    setToast({ text: result.reply, tone: result.changed ? "ok" : "info" });
  }, [project, selection, playhead, applyProject]);

  const removeSelected = useCallback(() => {
    if (!project) return;
    const result = removeEditorItem(project, selection);
    if (result.changed) {
      applyProject(result.project);
      setSelection(null);
    }
    setToast({ text: result.reply, tone: result.changed ? "ok" : "info" });
  }, [project, selection, applyProject]);

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
    [project, playhead],
  );

  /* ---------------- chat ---------------- */

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
    [fitDuration],
  );

  /* ---------------- save + export ---------------- */

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
  }, [id, title, saving]);

  const startExport = useCallback(async () => {
    if (dirty) await save();
    setExportPct(2);
    setExporting(true);
  }, [dirty, save]);

  useEffect(() => {
    if (!exporting) return;
    const t = setInterval(() => setExportPct((p) => Math.min(100, p + 6)), 230);
    return () => clearInterval(t);
  }, [exporting]);

  useEffect(() => {
    if (exporting && exportPct >= 100) {
      setExporting(false);
      setToast({ text: "Export selesai — MP4 siap diunduh (simulasi render lokal)", tone: "ok" });
    }
  }, [exporting, exportPct]);

  /* ---------------- keyboard ---------------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (typing) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        splitSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, togglePlay, removeSelected, splitSelected]);

  const steps = useMemo(
    () => [
      { label: "Ide cerita", href: `/jobs/${id}` },
      { label: "Naskah", href: `/jobs/${id}#script` },
      { label: "Storyboard", href: `/jobs/${id}#storyboard` },
    ],
    [id],
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950">
        <div className="flex flex-col items-center gap-3 text-white/45">
          <Loader2 className="size-6 animate-spin text-brand-400" />
          <p className="text-xs">Membuka editor…</p>
        </div>
      </div>
    );
  }

  if (error || !job || !project) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950 px-6">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-brand-400">{error ?? "Editor tidak tersedia"}</p>
          <Link
            href={`/jobs/${id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke job
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#08090d] text-white"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDragActive(true);
        }
      }}
      onDragLeave={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !e.currentTarget.contains(next)) setDragActive(false);
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          setDragActive(false);
          void importFiles(e.dataTransfer.files);
        }
      }}
    >
      <input
        ref={importInputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*,.mp4,.mov,.webm,.mkv,.mp3,.m4a,.wav,.aac,.ogg,.png,.jpg,.jpeg,.webp,.gif"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) void importFiles(files);
        }}
      />
      {dragActive && (
        <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-ink-950/70 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-brand-500/50 bg-ink-900/95 px-10 py-8 text-center shadow-2xl shadow-black/50">
            <Upload className="mx-auto size-7 text-brand-400" />
            <p className="mt-2 text-sm font-medium text-white/90">Lepas file untuk impor</p>
            <p className="mt-1 text-[11px] text-white/40">Video, gambar, atau audio (MP3/MP4)</p>
          </div>
        </div>
      )}
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/8 bg-ink-900/85 px-3 backdrop-blur-xl">
        <Link
          href={`/jobs/${id}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/8 hover:text-white"
          title="Kembali ke job"
          aria-label="Kembali ke job"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex min-w-0 items-center gap-1.5">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            spellCheck={false}
            className="w-[clamp(150px,24vw,340px)] truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[13px] font-medium text-white/90 outline-none transition hover:border-white/8 hover:bg-white/4 focus:border-brand-500/40 focus:bg-ink-950/60"
            aria-label="Judul video"
          />
          <PenLine className="size-3 shrink-0 text-white/25" />
        </div>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {steps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-white/45 transition hover:bg-white/5 hover:text-white/80"
            >
              <span className="grid size-3.5 place-items-center rounded-full bg-lime-500/15 text-lime-400">
                <Check className="size-2.5" />
              </span>
              {step.label}
            </Link>
          ))}
          <span className="ml-0.5 inline-flex items-center gap-1.5 rounded-full bg-[#2f5bff] px-2.5 py-1 text-[11px] font-medium text-white shadow-lg shadow-blue-500/20">
            <span className="grid size-3.5 place-items-center rounded-full bg-white/20 text-[8px]">4</span>
            Editor
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[10px] xl:inline-flex">
            {saving ? (
              <>
                <Loader2 className="size-3 animate-spin text-white/40" />
                <span className="text-white/40">Menyimpan…</span>
              </>
            ) : dirty ? (
              <>
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="text-amber-300/80">Belum disimpan</span>
              </>
            ) : (
              <>
                <Check className="size-3 text-lime-400" />
                <span className="text-white/35">
                  {savedAt
                    ? `Tersimpan ${new Date(savedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                    : "Tersimpan"}
                </span>
              </>
            )}
          </span>

          <button
            onClick={() => setMobilePanel((v) => !v)}
            className="grid size-8 place-items-center rounded-lg border border-white/8 bg-white/3 text-white/60 lg:hidden"
            aria-label="Buka chat AI"
          >
            <MessageSquare className="size-4" />
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-500/10 px-2.5 py-1.5 text-[11px] text-accent-400 transition hover:bg-accent-500/20 disabled:opacity-50"
            title="Impor video, gambar, atau audio"
          >
            {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            <span className="hidden sm:inline">{importing ? "Mengimpor…" : "Media"}</span>
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span className="hidden sm:inline">Simpan</span>
            <kbd className="ml-0.5 hidden rounded border border-white/12 bg-white/5 px-1 py-0.5 text-[8px] text-white/35 md:inline">
              Ctrl+S
            </kbd>
          </button>

          <button
            onClick={() => {
              setExportPct(0);
              setExportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f5bff] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110"
          >
            <Download className="size-3.5" /> Ekspor video
          </button>
        </div>
      </header>

      {/* workspace */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-16 shrink-0 flex-col items-center gap-0.5 border-r border-white/8 bg-ink-900/60 py-2.5 sm:flex">
            {TOOL_ITEMS.map(({ id: toolId, label, icon: Icon }) => {
              const active = tool === toolId;
              return (
                <button
                  key={toolId}
                  onClick={() => chooseTool(toolId)}
                  className={`group flex w-[52px] flex-col items-center gap-1 rounded-xl border py-1.5 text-[9px] transition ${
                    active
                      ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                      : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/75"
                  }`}
                  title={label}
                >
                  <Icon className={`size-4 ${active ? "text-brand-400" : "text-white/45 group-hover:text-white/75"}`} />
                  {label}
                </button>
              );
            })}
            <div className="mt-auto">
              <button
                onClick={() => {
                  setSideTab("chat");
                  setMobilePanel(true);
                }}
                className={`flex w-[52px] flex-col items-center gap-1 rounded-xl border py-1.5 text-[9px] transition ${
                  sideTab === "chat"
                    ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
                    : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/75"
                }`}
                title="Chat AI"
              >
                <Sparkles className="size-4 text-accent-400" />
                AI
              </button>
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1">
            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(139,92,246,0.10),transparent_60%)]">
              <PreviewStage
                job={job}
                project={project}
                playhead={playhead}
                playing={playing}
                onTogglePlay={togglePlay}
                onSeek={(t) => setPlayhead(t)}
                onPrev={prevClip}
                onNext={nextClip}
              />
            </section>

            <div
              className={`${
                mobilePanel
                  ? "fixed inset-y-14 right-0 z-40 flex max-w-[90vw] shadow-2xl shadow-black/60"
                  : "hidden"
              } lg:relative lg:inset-auto lg:z-auto lg:flex lg:max-w-none lg:shadow-none`}
            >
              <SidePanel
                job={job}
                project={project}
                selection={selection}
                tab={sideTab}
                setTab={setSideTab}
                thinking={thinking}
                onSend={sendChat}
                onUpdateMusic={updateMusic}
                onUpdateVoiceVolume={updateVoiceVolume}
                onUpdateClip={updateClip}
                onUpdateCaption={updateCaption}
                onUpdateOverlay={updateOverlay}
                onApplyMusicPreset={applyMusicPreset}
                onGenerateMusic={generateMusic}
                onSplit={splitSelected}
                onDelete={removeSelected}
                onToggleCaptions={toggleCaptions}
                onAddOverlay={addOverlay}
                onImportMedia={() => importInputRef.current?.click()}
                importing={importing}
              />
            </div>
          </main>
        </div>

        <Timeline
          project={project}
          playhead={playhead}
          playing={playing}
          selection={selection}
          tool={tool}
          onSelect={(sel) => {
            setSelection(sel);
            if (sel) setTool(sel.track === "music" ? "music" : sel.track === "caption" ? "caption" : sel.track === "overlay" ? "overlay" : "clip");
          }}
          onSeek={(t) => setPlayhead(t)}
          onUpdateClip={updateClip}
          onUpdateCaption={updateCaption}
          onUpdateOverlay={updateOverlay}
          onTrimClip={trimClip}
          onReorderClips={reorderClips}
          onSplit={splitSelected}
          onDelete={removeSelected}
          onAddOverlay={addOverlay}
          onOpenMusic={() => setSideTab("props")}
          onImport={() => importInputRef.current?.click()}
          onImportFiles={(files) => void importFiles(files)}
          importing={importing}
        />
      </div>

      {/* export modal */}
      {exportOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !exporting && setExportOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-white">Ekspor video</h2>
                <p className="mt-0.5 text-[10px] text-white/35">Render lokal · MP4 H.264 · {job.aspectRatio}</p>
              </div>
              <button
                onClick={() => !exporting && setExportOpen(false)}
                className="grid size-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Resolusi", job.aspectRatio === "9:16" ? "1080×1920" : job.aspectRatio === "16:9" ? "1920×1080" : "1080×1080"],
                  ["Durasi", `${duration.toFixed(1)}s`],
                  ["Track", `${project.clips.length} klip`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/8 bg-white/2 px-2 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-white/30">{label}</p>
                    <p className="mt-1 text-[11px] font-medium text-white/80">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {[`${project.captions.length} caption`, `${project.overlays.length} overlay`, project.music.title, `VO ${project.voiceVolume}%`].map((chip) => (
                  <span key={chip} className="rounded-full bg-white/5 px-2 py-0.5 text-[9.5px] text-white/45">
                    {chip}
                  </span>
                ))}
              </div>

              {(exporting || exportPct > 0) && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/45">
                      {exportPct >= 100 ? "Render selesai" : exporting ? "Merender frame & mixing audio…" : "Siap"}
                    </span>
                    <span className="tabular-nums text-white/60">{Math.round(exportPct)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        exportPct >= 100 ? "bg-lime-400" : "bg-gradient-to-r from-brand-500 to-accent-400"
                      }`}
                      style={{ width: `${Math.max(2, exportPct)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-3">
              <button
                onClick={() => !exporting && setExportOpen(false)}
                className="rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-[11px] text-white/60 transition hover:text-white"
              >
                {exportPct >= 100 ? "Tutup" : "Batal"}
              </button>
              <button
                onClick={startExport}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f5bff] px-3 py-1.5 text-[11px] font-medium text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                {exportPct >= 100 ? "Ekspor ulang" : exporting ? "Merender…" : "Ekspor sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-xl border px-4 py-2 text-[11px] shadow-2xl backdrop-blur ${showToastStyle(
            toast.tone,
          )}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
