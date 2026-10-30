"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Layers,
  Loader2,
  Mic2,
  Music2,
  Plus,
  Scissors,
  Trash2,
  Upload,
  ZoomIn,
} from "lucide-react";
import type {
  EditorCaption,
  EditorClip,
  EditorOverlay,
  EditorProject,
  EditorSelection,
  EditorTool,
} from "@/app/types";
import { MIN_CLIP, clamp, fmtRuler, fmtTime } from "@/app/lib/editor";

const LABEL_W = 96;
const CLIP_PALETTES = [
  ["#232326", "#e5e5e5"],
  ["#1b1b1e", "#fafafa"],
  ["#26262b", "#d4d4d4"],
  ["#1e1e21", "#f5f5f5"],
  ["#17171a", "#ececef"],
  ["#141416", "#e4e4e7"],
];

type DragTrack = "clip" | "caption" | "overlay";
type DragEdge = "move" | "start" | "end";

function Waveform({ seed, tone = "voice" }: { seed: number; tone?: "voice" | "music" }) {
  const bars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const a = Math.abs(Math.sin((i + 1) * 0.47 + seed * 1.3));
      const b = Math.abs(Math.cos((i + 1) * 0.19 + seed * 0.7));
      const h = 2 + (a * 0.65 + b * 0.35) * 22;
      return { x: i, h };
    });
  }, [seed]);
  const color = tone === "voice" ? "rgba(229,229,229,0.65)" : "rgba(163,163,163,0.7)";
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      aria-hidden
    >
      {bars.map((b) => (
        <rect
          key={b.x}
          x={b.x + 0.15}
          y={(26 - b.h) / 2}
          width={0.7}
          height={b.h}
          rx={0.35}
          fill={color}
        />
      ))}
    </svg>
  );
}

function TrackLabel({
  icon: Icon,
  label,
  active,
  onAdd,
}: {
  icon: typeof Clapperboard;
  label: string;
  active: boolean;
  onAdd?: () => void;
}) {
  return (
    <div
      className={`sticky left-0 z-30 flex w-24 shrink-0 items-center gap-1.5 border-r border-white/8 px-2 ${
        active ? "bg-brand-500/10" : "bg-ink-900/95"
      }`}
    >
      <Icon className={`size-3.5 shrink-0 ${active ? "text-brand-400" : "text-white/35"}`} />
      <span className={`truncate text-[10px] ${active ? "text-white/90" : "text-white/45"}`}>{label}</span>
      {onAdd && (
        <button
          onClick={onAdd}
          className="ml-auto grid size-4 shrink-0 place-items-center rounded text-white/35 transition hover:bg-white/10 hover:text-white"
          title="Tambah overlay di playhead"
          aria-label="Tambah overlay"
        >
          <Plus className="size-3" />
        </button>
      )}
    </div>
  );
}

export default function Timeline({
  project,
  playhead,
  playing,
  selection,
  tool,
  onSelect,
  onSeek,
  onUpdateClip,
  onUpdateCaption,
  onUpdateOverlay,
  onTrimClip,
  onReorderClips,
  onSplit,
  onDelete,
  onAddOverlay,
  onOpenMusic,
  onImport,
  onImportFiles,
  importing,
}: {
  project: EditorProject;
  playhead: number;
  playing: boolean;
  selection: EditorSelection | null;
  tool: EditorTool;
  onSelect: (sel: EditorSelection | null) => void;
  onSeek: (t: number) => void;
  onUpdateClip: (id: string, patch: Partial<EditorClip>) => void;
  onUpdateCaption: (id: string, patch: Partial<EditorCaption>) => void;
  onUpdateOverlay: (id: string, patch: Partial<EditorOverlay>) => void;
  onTrimClip: (id: string, edge: "start" | "end", time: number) => void;
  onReorderClips: (id: string, toIndex: number) => void;
  onSplit: () => void;
  onDelete: () => void;
  onAddOverlay: () => void;
  onOpenMusic: () => void;
  onImport: () => void;
  onImportFiles: (files: FileList) => void;
  importing: boolean;
}) {
  const [pps, setPps] = useState(24);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clipsLaneRef = useRef<HTMLDivElement>(null);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const duration = project.duration;
  const totalWidth = Math.max(480, duration * pps);

  const tickStep = useMemo(() => {
    const candidates = [0.5, 1, 2, 5, 10, 15, 30, 60, 120];
    return candidates.find((s) => s * pps >= 56) ?? 120;
  }, [pps]);

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let t = 0; t <= duration + 0.001; t += tickStep) out.push(Math.round(t * 100) / 100);
    return out;
  }, [duration, tickStep]);

  useEffect(() => {
    if (!playing) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = LABEL_W + playhead * pps;
    if (x > el.scrollLeft + el.clientWidth - 100) {
      el.scrollLeft = x - el.clientWidth + 160;
    } else if (x < el.scrollLeft + LABEL_W + 20) {
      el.scrollLeft = Math.max(0, x - LABEL_W - 60);
    }
  }, [playhead, playing, pps]);

  const updateItem = (track: DragTrack, id: string, patch: { start?: number; end?: number }) => {
    if (track === "clip") onUpdateClip(id, patch);
    else if (track === "caption") onUpdateCaption(id, patch);
    else onUpdateOverlay(id, patch);
  };

  const beginDrag = (
    e: React.PointerEvent,
    track: DragTrack,
    item: { id: string; start: number; end: number },
    edge: DragEdge,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect({ track, id: item.id });
    const originX = e.clientX;
    const orig = { start: item.start, end: item.end };

    const onMove = (ev: PointerEvent) => {
      const delta = (ev.clientX - originX) / pps;
      const minLen = 0.4;
      let start = orig.start;
      let end = orig.end;

      if (edge === "move") {
        const len = orig.end - orig.start;
        start = clamp(orig.start + delta, 0, Math.max(0, duration - len));
        end = Math.min(duration, start + len);
      } else if (edge === "start") {
        start = clamp(orig.start + delta, 0, orig.end - minLen);
      } else {
        end = clamp(orig.end + delta, orig.start + minLen, duration);
      }

      start = Math.round(start * 10) / 10;
      end = Math.round(end * 10) / 10;
      updateItem(track, item.id, { start, end });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };

    document.body.style.cursor = edge === "move" ? "grabbing" : "ew-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const clipDropIndex = (id: string, clientX: number) => {
    const lane = clipsLaneRef.current;
    if (!lane) return 0;
    const rect = lane.getBoundingClientRect();
    const at = clamp((clientX - rect.left) / pps, 0, duration);
    const others = project.clips.filter((c) => c.id !== id);
    const index = others.findIndex((c) => at < (c.start + c.end) / 2);
    return index < 0 ? others.length : index;
  };

  const clipMarker = useMemo(() => {
    if (!draggingClip || dropIndex === null) return null;
    const others = project.clips.filter((c) => c.id !== draggingClip);
    let cursor = 0;
    for (let i = 0; i < dropIndex && i < others.length; i += 1) {
      cursor += Math.max(MIN_CLIP, others[i].end - others[i].start);
    }
    return cursor;
  }, [draggingClip, dropIndex, project.clips]);

  /** Clips are a single sequence: dragging reorders, trimming ripples the rest. */
  const beginClipDrag = (e: React.PointerEvent, item: EditorClip, edge: DragEdge) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect({ track: "clip", id: item.id });
    const originX = e.clientX;
    const orig = { start: item.start, end: item.end };

    if (edge === "move") {
      setDraggingClip(item.id);
      setDropIndex(project.clips.findIndex((c) => c.id === item.id));
    }

    const onMove = (ev: PointerEvent) => {
      const delta = (ev.clientX - originX) / pps;
      if (edge === "start") {
        onTrimClip(item.id, "start", clamp(orig.start + delta, 0, orig.end - MIN_CLIP));
      } else if (edge === "end") {
        onTrimClip(item.id, "end", clamp(orig.end + delta, orig.start + MIN_CLIP, duration));
      } else {
        setDropIndex(clipDropIndex(item.id, ev.clientX));
      }
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      if (edge === "move") {
        onReorderClips(item.id, clipDropIndex(item.id, ev.clientX));
        setDraggingClip(null);
        setDropIndex(null);
      }
    };

    document.body.style.cursor = edge === "move" ? "grabbing" : "ew-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const beginScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const apply = (clientX: number) => {
      const t = clamp((clientX - rect.left) / pps, 0, duration);
      onSeek(Math.round(t * 10) / 10);
    };
    apply(e.clientX);
    const onMove = (ev: PointerEvent) => apply(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const splitEnabled =
    !!selection &&
    selection.track !== "music" &&
    (() => {
      const item =
        selection.track === "clip"
          ? project.clips.find((c) => c.id === selection.id)
          : selection.track === "caption"
            ? project.captions.find((c) => c.id === selection.id)
            : project.overlays.find((o) => o.id === selection.id);
      return !!item && playhead > item.start + 0.25 && playhead < item.end - 0.25;
    })();

  const selectedName = (() => {
    if (!selection) return null;
    if (selection.track === "clip") return project.clips.find((c) => c.id === selection.id)?.title;
    if (selection.track === "caption") return "Caption";
    if (selection.track === "overlay") return "Overlay";
    return project.music.title;
  })();

  return (
    <div
      className="border-t border-white/8 bg-ink-900/80 pb-1.5"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          onImportFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="flex h-10 items-center gap-1.5 px-2.5">
        <button
          onClick={onImport}
          disabled={importing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-500/10 px-2.5 py-1.5 text-[11px] text-accent-400 transition hover:bg-accent-500/20 disabled:opacity-50"
          title="Impor video, gambar, atau audio"
        >
          {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {importing ? "Mengimpor…" : "Impor"}
        </button>
        <button
          onClick={onSplit}
          disabled={!splitEnabled}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-white/70 transition hover:bg-white/8 hover:text-white disabled:opacity-30"
          title="Potong item terpilih di playhead"
        >
          <Scissors className="size-3.5" /> Potong
        </button>
        <button
          onClick={onDelete}
          disabled={!selection}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-white/70 transition hover:bg-white/8 hover:text-brand-400 disabled:opacity-30"
          title="Hapus item terpilih"
        >
          <Trash2 className="size-3.5" /> Hapus
        </button>

        {selectedName && (
          <span className="ml-1 hidden max-w-[200px] truncate rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] text-brand-400 sm:inline">
            {selectedName} · {fmtTime(playhead)}
          </span>
        )}

        <p className="ml-2 hidden truncate text-[10px] text-white/30 lg:block">
          Klik untuk memilih, tarik tepinya untuk mengubah durasi, geser untuk memindahkan.
        </p>

        <div className="ml-auto flex items-center gap-2 pl-2">
          <ZoomIn className="size-3.5 text-white/35" />
          <input
            type="range"
            min={10}
            max={64}
            step={1}
            value={pps}
            onChange={(e) => setPps(Number(e.target.value))}
            className="w-24 accent-brand-500"
            aria-label="Zoom timeline"
          />
          <span className="hidden w-8 text-right text-[10px] tabular-nums text-white/35 sm:block">{pps}px</span>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[236px] overflow-x-auto overflow-y-hidden">
        <div className="relative min-w-max">
          {/* ruler */}
          <div className="flex border-t border-white/6">
            <div className="sticky left-0 z-30 flex w-24 shrink-0 items-center border-r border-white/8 bg-ink-900/95 px-2 text-[9px] uppercase tracking-wide text-white/25">
              Timeline
            </div>
            <div
              className="relative h-7 cursor-ew-resize select-none bg-ink-950/40"
              style={{ width: totalWidth }}
              onPointerDown={beginScrub}
            >
              {ticks.map((t) => (
                <div key={t} className="absolute inset-y-0" style={{ left: t * pps }}>
                  <div className="h-2 w-px bg-white/20" />
                  <span className="absolute left-1 top-1 whitespace-nowrap text-[9px] tabular-nums text-white/35">
                    {fmtRuler(t)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* clips */}
          <div className="flex border-t border-white/6">
            <TrackLabel icon={Clapperboard} label="Klip" active={tool === "clip"} />
            <div
              ref={clipsLaneRef}
              className="relative h-12"
              style={{ width: totalWidth }}
            >
              {project.clips.map((clip, clipIndex) => {
                const palette = CLIP_PALETTES[(clip.sceneIndex - 1) % CLIP_PALETTES.length];
                const selected = selection?.track === "clip" && selection.id === clip.id;
                const dragging = draggingClip === clip.id;
                const background =
                  clip.media?.kind === "image"
                    ? `linear-gradient(135deg, rgba(8,10,16,0.5), rgba(8,10,16,0.88)), url("${clip.media.url}") center/cover`
                    : `linear-gradient(135deg, ${palette[0]}, rgba(10,12,18,0.92))`;
                return (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 z-10 cursor-grab overflow-hidden rounded-lg border text-left transition active:cursor-grabbing ${
                      selected
                        ? "border-brand-400 ring-2 ring-brand-500/30"
                        : "border-white/12 hover:border-white/25"
                    } ${dragging ? "opacity-40 ring-2 ring-brand-500/40" : ""}`}
                    style={{
                      left: clip.start * pps,
                      width: Math.max(14, (clip.end - clip.start) * pps),
                      background,
                    }}
                    onPointerDown={(e) => beginClipDrag(e, clip, "move")}
                    title={`${clip.title} · ${fmtTime(clip.start)}–${fmtTime(clip.end)} — geser untuk mengurutkan ulang`}
                  >
                    <div className="pointer-events-none flex h-full">
                      <div
                        className="relative flex w-8 shrink-0 items-center justify-center border-r border-white/10"
                        style={{ background: `linear-gradient(160deg, ${palette[1]}55, transparent)` }}
                      >
                        {clip.media?.kind === "video" ? (
                          <Film className="size-3 text-white/80" />
                        ) : clip.media?.kind === "image" ? (
                          <ImageIcon className="size-3 text-white/80" />
                        ) : (
                          <span className="text-[10px] font-bold tabular-nums text-white/80">
                            {String(clip.sceneIndex).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 px-1.5 py-1">
                        <p className="truncate text-[9px] font-medium leading-tight text-white/80">{clip.title}</p>
                        <p className="mt-0.5 truncate text-[8px] tabular-nums text-white/35">
                          {(clip.end - clip.start).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                    {clipIndex > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 z-20 w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/40"
                        onPointerDown={(e) => beginClipDrag(e, clip, "start")}
                      />
                    )}
                    <div
                      className="absolute inset-y-0 right-0 z-20 w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/40"
                      onPointerDown={(e) => beginClipDrag(e, clip, "end")}
                    />
                  </div>
                );
              })}
              {draggingClip && clipMarker !== null && (
                <div
                  className="pointer-events-none absolute inset-y-0 z-30 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                  style={{ left: clipMarker * pps }}
                >
                  <span className="absolute -top-0.5 left-1 whitespace-nowrap rounded bg-white px-1 py-0.5 text-[8px] font-medium text-black">
                    lepas
                  </span>
                </div>
              )}
              {project.clips.length === 0 && (
                <button
                  onClick={onImport}
                  className="absolute inset-y-1.5 left-2 inline-flex items-center gap-1 rounded border border-dashed border-white/15 px-2 text-[9px] text-white/35 transition hover:border-white/30 hover:text-white/60"
                >
                  <Upload className="size-2.5" /> Impor video atau gambar
                </button>
              )}
            </div>
          </div>

          {/* captions */}
          <div className="flex border-t border-white/6">
            <TrackLabel icon={Captions} label="Caption" active={tool === "caption"} />
            <div className={`relative h-8 ${project.captionsEnabled ? "" : "opacity-40"}`} style={{ width: totalWidth }}>
              {project.captions.map((cap) => {
                const selected = selection?.track === "caption" && selection.id === cap.id;
                return (
                  <div
                    key={cap.id}
                    className={`absolute top-1 bottom-1 z-10 cursor-grab overflow-hidden rounded border px-1.5 py-1 text-left transition active:cursor-grabbing ${
                      selected
                        ? "border-brand-400 bg-brand-500/25 text-white ring-2 ring-brand-500/25"
                        : "border-amber-400/25 bg-amber-400/10 text-amber-100/80 hover:border-amber-300/40"
                    }`}
                    style={{ left: cap.start * pps, width: Math.max(12, (cap.end - cap.start) * pps) }}
                    onPointerDown={(e) => beginDrag(e, "caption", cap, "move")}
                    title={`${cap.text} · ${fmtTime(cap.start)}–${fmtTime(cap.end)}`}
                  >
                    <p className="truncate text-[9px] leading-tight">{cap.text}</p>
                    <div
                      className="absolute inset-y-0 right-0 z-20 w-1.5 cursor-ew-resize hover:bg-white/40"
                      onPointerDown={(e) => beginDrag(e, "caption", cap, "end")}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* voice */}
          <div className="flex border-t border-white/6">
            <TrackLabel icon={Mic2} label="Suara TTS" active={tool === "voice"} />
            <div
              className="relative h-9 cursor-pointer bg-white/[0.015]"
              style={{ width: totalWidth }}
              onPointerDown={beginScrub}
            >
              {project.clips.map((clip) => (
                <div
                  key={clip.id}
                  className="absolute inset-y-1 overflow-hidden rounded border border-accent-400/20 bg-accent-500/10"
                  style={{ left: clip.start * pps, width: Math.max(10, (clip.end - clip.start) * pps - 1) }}
                  title={`Voice over · ${clip.title}`}
                >
                  <Waveform seed={clip.sceneIndex} />
                  {(clip.end - clip.start) * pps > 90 && (
                    <span className="pointer-events-none absolute left-1.5 top-1 truncate text-[8px] text-accent-400/70">
                      VO · {clip.title}
                    </span>
                  )}
                </div>
              ))}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/10"
                aria-hidden
              />
            </div>
          </div>

          {/* music */}
          <div className="flex border-t border-white/6">
            <TrackLabel icon={Music2} label="Musik" active={tool === "music"} />
            <div className="relative h-9" style={{ width: totalWidth }}>
              <div
                className={`absolute inset-y-1 z-10 cursor-pointer overflow-hidden rounded border ${
                  selection?.track === "music"
                    ? "border-brand-400 bg-lime-500/20 ring-2 ring-brand-500/25"
                    : "border-lime-400/25 bg-lime-500/10 hover:border-lime-400/40"
                } ${project.music.volume === 0 ? "opacity-40" : ""}`}
                style={{ left: 0, width: totalWidth }}
                onPointerDown={() => {
                  onSelect({ track: "music", id: "music" });
                  onOpenMusic();
                }}
                title={`${project.music.title}.mp3 · volume ${project.music.volume}%`}
              >
                <Waveform seed={1.7} tone="music" />
                <span className="pointer-events-none absolute left-2 top-1.5 inline-flex items-center gap-1 rounded bg-lime-950/60 px-1.5 py-0.5 text-[8.5px] text-lime-100/85">
                  <Music2 className="size-2.5" />
                  {project.music.volume === 0 ? "Musik dimatikan" : `${project.music.title}.mp3`}
                </span>
              </div>
            </div>
          </div>

          {/* overlays */}
          <div className="flex border-t border-white/6">
            <TrackLabel icon={Layers} label="Overlay" active={tool === "overlay"} onAdd={onAddOverlay} />
            <div className="relative h-8" style={{ width: totalWidth }}>
              {project.overlays.map((ov) => {
                const selected = selection?.track === "overlay" && selection.id === ov.id;
                return (
                  <div
                    key={ov.id}
                    className={`absolute top-1 bottom-1 z-10 cursor-grab overflow-hidden rounded border px-1.5 py-1 text-left transition active:cursor-grabbing ${
                      selected
                        ? "border-brand-400 bg-brand-500/25 text-white ring-2 ring-brand-500/25"
                        : "border-sky-400/25 bg-sky-400/10 text-sky-100/80 hover:border-sky-300/40"
                    }`}
                    style={{ left: ov.start * pps, width: Math.max(12, (ov.end - ov.start) * pps) }}
                    onPointerDown={(e) => beginDrag(e, "overlay", ov, "move")}
                    title={`${ov.text} · ${fmtTime(ov.start)}–${fmtTime(ov.end)}`}
                  >
                    <p className="truncate text-[9px] leading-tight">{ov.text}</p>
                    <div
                      className="absolute inset-y-0 right-0 z-20 w-1.5 cursor-ew-resize hover:bg-white/40"
                      onPointerDown={(e) => beginDrag(e, "overlay", ov, "end")}
                    />
                  </div>
                );
              })}
              {project.overlays.length === 0 && (
                <button
                  onClick={onAddOverlay}
                  className="absolute inset-y-1.5 left-2 inline-flex items-center gap-1 rounded border border-dashed border-white/15 px-2 text-[9px] text-white/35 transition hover:border-white/30 hover:text-white/60"
                >
                  <Plus className="size-2.5" /> Tambah overlay
                </button>
              )}
            </div>
          </div>

          {/* playhead */}
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-brand-400"
            style={{ left: LABEL_W + playhead * pps }}
          >
            <div className="absolute -left-[5px] top-0 size-[11px] rounded-full border-2 border-white bg-brand-500 shadow" />
          </div>
        </div>
      </div>
    </div>
  );
}
