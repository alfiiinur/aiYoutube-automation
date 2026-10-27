"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Aperture,
  Captions as CaptionsIcon,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import type { EditorCaption, EditorOverlay, EditorProject, VideoJob } from "@/app/types";
import { fmtTime } from "@/app/lib/editor";

const PALETTES = [
  { from: "#2b1a3d", to: "#120d1c", glow: "rgba(244,63,94,0.45)", accent: "#ff6b8a" },
  { from: "#122c3c", to: "#0a131c", glow: "rgba(56,189,248,0.35)", accent: "#7dd3fc" },
  { from: "#2f2114", to: "#171008", glow: "rgba(245,158,11,0.35)", accent: "#fbbf24" },
  { from: "#1b2b1e", to: "#0b130d", glow: "rgba(163,230,53,0.32)", accent: "#bef264" },
  { from: "#261634", to: "#130b1b", glow: "rgba(167,139,250,0.4)", accent: "#c4b5fd" },
  { from: "#301a22", to: "#170c11", glow: "rgba(244,114,182,0.32)", accent: "#f9a8d4" },
];

function captionClass(caption: EditorCaption, playing: boolean, playhead: number) {
  const base =
    "pointer-events-none absolute left-1/2 w-[88%] -translate-x-1/2 text-center leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]";
  const pos =
    caption.position === "top" ? "top-10" : caption.position === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-11";
  if (caption.style === "bold") {
    return `${base} ${pos} text-[15px] font-black uppercase tracking-tight text-white [text-shadow:0_2px_0_#000,0_0_10px_rgba(0,0,0,0.85)]`;
  }
  if (caption.style === "minimal") {
    return `${base} ${pos} text-[12px] font-medium text-white/95 [&>span]:rounded-md [&>span]:bg-black/65 [&>span]:px-1.5 [&>span]:py-0.5`;
  }
  return `${base} ${pos} text-[14px] font-bold ${playing ? "" : ""}`;
}

function ActiveCaption({
  caption,
  playhead,
  playing,
}: {
  caption: EditorCaption;
  playhead: number;
  playing: boolean;
}) {
  if (caption.style !== "karaoke") {
    return <div className={captionClass(caption, playing, playhead)}>{caption.text}</div>;
  }
  const words = caption.text.split(/\s+/).filter(Boolean);
  const progress = Math.min(1, Math.max(0, (playhead - caption.start) / Math.max(0.2, caption.end - caption.start)));
  const active = Math.ceil(progress * words.length);
  return (
    <div className={captionClass(caption, playing, playhead)}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className={i < active ? "text-lime-300" : "text-white/90"}>
          {word}{" "}
        </span>
      ))}
    </div>
  );
}

function ActiveOverlay({ overlay }: { overlay: EditorOverlay }) {
  if (overlay.variant === "title") {
    return (
      <div className="pointer-events-none absolute inset-x-4 top-[18%] text-center">
        <div className="mx-auto inline-block max-w-[92%] border-y border-white/25 bg-black/25 px-3 py-1.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.18em] text-white/90 backdrop-blur-sm">
          <span className="line-clamp-2">{overlay.text}</span>
        </div>
      </div>
    );
  }
  if (overlay.variant === "lower-third") {
    return (
      <div className="pointer-events-none absolute bottom-24 left-4 max-w-[75%] border-l-2 border-brand-400 bg-black/55 px-2.5 py-1.5 text-left backdrop-blur-sm">
        <p className="text-[11px] font-semibold leading-snug text-white">{overlay.text}</p>
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute right-3 top-[13%] max-w-[60%] truncate rounded-full bg-brand-500/90 px-2.5 py-1 text-[9px] font-semibold text-white shadow-lg shadow-brand-500/30">
      {overlay.text}
    </div>
  );
}

export default function PreviewStage({
  job,
  project,
  playhead,
  playing,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
}: {
  job: VideoJob;
  project: EditorProject;
  playhead: number;
  playing: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setBox({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ratio =
    job.aspectRatio === "16:9" ? 16 / 9 : job.aspectRatio === "1:1" ? 1 : job.aspectRatio === "4:5" ? 4 / 5 : 9 / 16;

  let frameW = box.w;
  let frameH = frameW / ratio;
  if (frameH > box.h) {
    frameH = box.h;
    frameW = frameH * ratio;
  }

  const activeClip = useMemo(() => {
    if (project.clips.length === 0) return null;
    return (
      project.clips.find((c) => playhead >= c.start && playhead < c.end) ??
      project.clips[project.clips.length - 1]
    );
  }, [project.clips, playhead]);

  const activeCaption = project.captionsEnabled
    ? project.captions.find((c) => playhead >= c.start && playhead < c.end)
    : undefined;

  const activeOverlays = project.overlays.filter((o) => playhead >= o.start && playhead < o.end);

  const palette = PALETTES[((activeClip?.sceneIndex ?? 1) - 1) % PALETTES.length];
  const sceneCount = Math.max(1, project.clips.length);
  const progress = Math.min(100, (playhead / Math.max(0.1, project.duration)) * 100);
  const musicUrl = project.music.file?.url;

  /* Keep imported video in sync with the timeline playhead. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeClip?.media?.kind !== "video") return;
    const target = Math.max(0, playhead - activeClip.start);
    if (Math.abs(video.currentTime - target) > 0.3) {
      try {
        video.currentTime = target;
      } catch {
        /* metadata may not be ready yet */
      }
    }
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playhead, playing, activeClip]);

  /* Imported music follows play/pause and volume, with light drift correction. */
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio || !musicUrl) return;
    audio.volume = Math.min(1, Math.max(0, project.music.volume / 100));
    const target = audio.duration > 0 ? playhead % audio.duration : playhead;
    if (Math.abs(audio.currentTime - target) > 0.5) {
      try {
        audio.currentTime = target;
      } catch {
        /* ignore until the audio metadata is available */
      }
    }
    if (playing) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [playhead, playing, musicUrl, project.music.volume]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {musicUrl && <audio ref={musicRef} src={musicUrl} loop preload="auto" className="hidden" />}
      <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center px-5 py-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/50"
          style={{ width: Math.max(0, frameW), height: Math.max(0, frameH) }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 32% 18%, ${palette.glow}, transparent 58%), linear-gradient(160deg, ${palette.from}, ${palette.to})`,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div
            className="absolute -right-10 top-1/4 size-36 rounded-full blur-3xl"
            style={{ background: palette.glow }}
          />

          {activeClip?.media?.kind === "image" && (
            <img
              src={activeClip.media.url}
              alt={activeClip.title}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {activeClip?.media?.kind === "video" && (
            <video
              key={activeClip.id}
              ref={videoRef}
              src={activeClip.media.url}
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

          <div className="relative flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
                  Scene {String(activeClip?.sceneIndex ?? 1).padStart(2, "0")} / {String(sceneCount).padStart(2, "0")}
                </p>
                <p className="mt-1 max-w-[170px] text-[10px] leading-snug text-white/60">
                  {activeClip?.visual ?? "Scene belum tersedia"}
                </p>
              </div>
              <div className="rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[8px] uppercase tracking-wide text-white/60 backdrop-blur-sm">
                {activeClip?.broll ?? "b-roll"}
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="relative grid size-28 place-items-center">
                <div
                  className="absolute inset-0 rounded-[28%] border border-white/15"
                  style={{ background: `linear-gradient(145deg, ${palette.accent}22, transparent 70%)` }}
                />
                <div className="absolute inset-4 rotate-12 rounded-[32%] border border-white/10" />
                <span className="relative text-5xl font-black tabular-nums text-white/15">
                  {String(activeClip?.sceneIndex ?? 1).padStart(2, "0")}
                </span>
                <Aperture className="absolute bottom-3 right-3 size-4" style={{ color: palette.accent }} />
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <p className="max-w-[75%] truncate text-[9px] uppercase tracking-wider text-white/35">
                {activeClip?.title ?? job.title}
              </p>
              <div className="flex items-center gap-1 text-[8px] text-white/35">
                <CaptionsIcon className="size-2.5" /> {project.captionsEnabled ? "CC" : "CC off"}
              </div>
            </div>
          </div>

          {activeOverlays.map((o) => (
            <ActiveOverlay key={o.id} overlay={o} />
          ))}
          {activeCaption && <ActiveCaption caption={activeCaption} playhead={playhead} playing={playing} />}

          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
            <div className="h-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 pb-3 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="grid size-8 place-items-center rounded-lg text-white/55 transition hover:bg-white/8 hover:text-white"
            title="Klip sebelumnya"
            aria-label="Klip sebelumnya"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="grid size-11 place-items-center rounded-full bg-white text-ink-950 shadow-lg shadow-black/30 transition hover:scale-105"
            title={playing ? "Jeda (Spasi)" : "Putar (Spasi)"}
            aria-label={playing ? "Jeda" : "Putar"}
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
          </button>
          <button
            onClick={onNext}
            className="grid size-8 place-items-center rounded-lg text-white/55 transition hover:bg-white/8 hover:text-white"
            title="Klip berikutnya"
            aria-label="Klip berikutnya"
          >
            <SkipForward className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] tabular-nums text-white/65">
          <span className="text-white">{fmtTime(playhead)}</span>
          <span className="text-white/25">/</span>
          <span className="text-white/40">{fmtTime(project.duration)}</span>
        </div>

        <div className="ml-2 hidden items-center gap-1.5 text-[10px] text-white/30 sm:flex">
          <kbd className="rounded border border-white/12 bg-white/5 px-1.5 py-0.5 font-sans">Spasi</kbd>
          putar / jeda
        </div>

        <div className="ml-auto flex items-center gap-1 text-[10px] text-white/30">
          <button
            onClick={() => onSeek(Math.max(0, playhead - 5))}
            className="grid size-7 place-items-center rounded-md transition hover:bg-white/8 hover:text-white"
            title="Mundur 5 detik"
          >
            <span className="-scale-x-100 text-[10px]">↺</span>
          </button>
          <Volume2 className="size-3.5" />
          <span className="tabular-nums">{project.voiceVolume}</span>
        </div>
      </div>
    </div>
  );
}
