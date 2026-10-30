import type { EditorCaption, EditorClip, EditorOverlay, EditorProject, VideoJob } from "@/app/types";
import { storyboardImageUrl } from "@/app/lib/storyboard-image";
import {
  captionFontWeight,
  ensureCaptionFontsLoaded,
  resolveCanvasFontFamily,
} from "@/app/lib/caption-fonts";
import { isMonochrome, paletteAt, type VisualPalette } from "@/app/lib/visual-palette";

export interface ExportOptions {
  job: VideoJob;
  project: EditorProject;
  onProgress?: (pct: number, phase: string) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  extension: "mp4" | "webm";
  mime: string;
  warnings: string[];
  /** Object URL untuk tombol unduh manual (auto-revoke setelah 10 menit). */
  downloadUrl: string;
}

const FPS = 30;

export function exportDimensions(aspect: string): { width: number; height: number } {
  switch (aspect) {
    case "16:9":
      return { width: 1280, height: 720 };
    case "1:1":
      return { width: 900, height: 900 };
    case "4:5":
      return { width: 864, height: 1080 };
    case "9:16":
    default:
      return { width: 720, height: 1280 };
  }
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "video"
  );
}

function pickMime(): { mime: string; extension: "mp4" | "webm" } {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.4D401E,mp4a.40.2",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return { mime, extension: mime.includes("mp4") ? "mp4" : "webm" };
    }
  }
  return { mime: "", extension: "webm" };
}

function hexAlpha(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  w: number,
  h: number,
) {
  if (!sw || !sh) return;
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(1, lines[maxLines - 1].length - 1))}…`;
  }
  return lines;
}

function activeClipAt(clips: EditorClip[], t: number): EditorClip | null {
  if (clips.length === 0) return null;
  return clips.find((clip) => t >= clip.start && t < clip.end) ?? clips[clips.length - 1];
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: EditorCaption,
  playhead: number,
  palette: VisualPalette,
  w: number,
  h: number,
) {
  const bold = caption.style === "bold";
  const size = Math.round(w * (caption.style === "minimal" ? 0.031 : bold ? 0.044 : 0.04));
  const weight = captionFontWeight(caption);
  ctx.font = `${caption.italic ? "italic " : ""}${weight} ${size}px ${resolveCanvasFontFamily(caption.font)}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const raw = bold ? caption.text.toUpperCase() : caption.text;
  const maxWidth = w * 0.86;
  const lines = wrapCanvasText(ctx, raw, maxWidth, 3);
  if (lines.length === 0) return;

  const lineHeight = Math.round(size * 1.28);
  const blockHeight = lines.length * lineHeight;
  const centerY =
    caption.position === "top"
      ? h * 0.14 + blockHeight / 2
      : caption.position === "middle"
        ? h / 2
        : h * 0.86 - blockHeight / 2;

  if (caption.style === "minimal") {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    roundRect(ctx, w * 0.07, centerY - blockHeight / 2 - size * 0.35, w * 0.86, blockHeight + size * 0.7, size * 0.35);
    ctx.fill();
    ctx.restore();
  }

  const progress = Math.min(
    1,
    Math.max(0, (playhead - caption.start) / Math.max(0.2, caption.end - caption.start)),
  );
  const totalWords = lines.reduce((sum, line) => sum + line.split(/\s+/).filter(Boolean).length, 0);
  const activeWords = Math.ceil(progress * totalWords);
  let wordCursor = 0;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = size * 0.35;
  ctx.shadowOffsetY = Math.round(size * 0.06);

  lines.forEach((line, lineIndex) => {
    const y = centerY - blockHeight / 2 + lineHeight / 2 + lineIndex * lineHeight;
    if (caption.style !== "karaoke") {
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, w / 2, y);
      return;
    }
    const words = line.split(/\s+/).filter(Boolean);
    const gap = ctx.measureText(" ").width;
    const widths = words.map((word) => ctx.measureText(word).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, words.length - 1);
    let x = w / 2 - total / 2;
    ctx.textAlign = "left";
    words.forEach((word, i) => {
      ctx.fillStyle = wordCursor + i < activeWords ? palette.accent : "#ffffff";
      ctx.fillText(word, x, y);
      x += widths[i] + gap;
    });
    ctx.textAlign = "center";
    wordCursor += words.length;
  });
  ctx.restore();
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: EditorOverlay,
  palette: VisualPalette,
  w: number,
  h: number,
) {
  const size = Math.round(w * 0.026);
  ctx.save();
  ctx.textBaseline = "middle";

  if (overlay.variant === "title") {
    ctx.font = `700 ${size}px "Inter", system-ui, sans-serif`;
    const lines = wrapCanvasText(ctx, overlay.text.toUpperCase(), w * 0.8, 2);
    const lineHeight = Math.round(size * 1.35);
    const blockHeight = lines.length * lineHeight;
    const boxW = w * 0.86;
    const boxH = blockHeight + size * 1.1;
    const y = h * 0.18;
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    roundRect(ctx, (w - boxW) / 2, y - boxH / 2, boxW, boxH, size * 0.25);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(1, w * 0.002);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, y - blockHeight / 2 + lineHeight / 2 + i * lineHeight);
    });
  } else if (overlay.variant === "lower-third") {
    ctx.font = `600 ${size}px "Inter", system-ui, sans-serif`;
    const lines = wrapCanvasText(ctx, overlay.text, w * 0.62, 3);
    const lineHeight = Math.round(size * 1.35);
    const blockHeight = lines.length * lineHeight;
    const x = w * 0.07;
    const y = h * 0.7;
    const boxH = blockHeight + size * 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(x, y - boxH / 2, w * 0.7, boxH);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(x, y - boxH / 2, Math.max(3, w * 0.006), boxH);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    lines.forEach((line, i) => {
      ctx.fillText(line, x + w * 0.025, y - blockHeight / 2 + lineHeight / 2 + i * lineHeight);
    });
  } else {
    ctx.font = `700 ${Math.round(w * 0.022)}px "Inter", system-ui, sans-serif`;
    const text = overlay.text.length > 42 ? `${overlay.text.slice(0, 41)}…` : overlay.text;
    const padding = w * 0.02;
    const textW = ctx.measureText(text).width;
    const boxW = textW + padding * 2;
    const boxH = w * 0.06;
    const x = w - boxW - w * 0.05;
    const y = h * 0.1;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, y, boxW, boxH, boxH / 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.textAlign = "center";
    ctx.fillText(text, x + boxW / 2, y + boxH / 2);
  }
  ctx.restore();
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar ${url}`));
    img.src = url;
  });
}

async function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    const done = () => {
      video.removeEventListener("loadeddata", done);
      video.removeEventListener("error", fail);
      resolve(video);
    };
    const fail = () => {
      video.removeEventListener("loadeddata", done);
      video.removeEventListener("error", fail);
      reject(new Error(`Gagal memuat video ${url}`));
    };
    video.addEventListener("loadeddata", done);
    video.addEventListener("error", fail);
    video.load();
  });
}

async function fetchAudioBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Audio ${res.status}`);
  const array = await res.arrayBuffer();
  return ctx.decodeAudioData(array);
}

export async function exportProjectToVideo(options: ExportOptions): Promise<ExportResult> {
  const { job, project, onProgress, signal } = options;
  if (typeof window === "undefined") throw new Error("Ekspor hanya bisa dijalankan di browser");
  if (typeof MediaRecorder === "undefined") throw new Error("Browser ini belum mendukung MediaRecorder");

  const { width, height } = exportDimensions(job.aspectRatio);
  const duration = Math.max(1, project.duration);
  const warnings: string[] = [];

  const report = (pct: number, phase: string) => onProgress?.(Math.min(100, Math.max(0, pct)), phase);
  report(1, "Menyiapkan aset…");

  const clips = project.clips;
  const sceneByIndex = new Map((job.scenes ?? []).map((scene) => [scene.index, scene]));

  /* ---------- preload visuals ---------- */
  const images = new Map<string, HTMLImageElement>();
  const videos = new Map<string, HTMLVideoElement>();

  const imageJobs = clips.map(async (clip) => {
    try {
      if (clip.media?.kind === "image") {
        images.set(clip.id, await loadImage(clip.media.url));
        return;
      }
      if (clip.media?.kind === "video") {
        videos.set(clip.id, await loadVideo(clip.media.url));
        return;
      }
      const scene = sceneByIndex.get(clip.sceneIndex);
      if (scene) {
        const base = storyboardImageUrl(job, scene, job.scenes?.length ?? 1);
        const url = base.startsWith("/api/storyboard-image")
          ? `${base}${base.includes("?") ? "&" : "?"}bare=1`
          : base;
        images.set(clip.id, await loadImage(url));
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Sebagian aset visual gagal dimuat");
    }
  });

  await Promise.allSettled([...imageJobs, ensureCaptionFontsLoaded(project.captions)]);
  report(12, "Aset visual siap");

  /* ---------- audio context + buffers ---------- */
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) throw new Error("Web Audio API tidak tersedia di browser ini");

  const audioCtx = new AudioCtor();
  try {
    await audioCtx.resume();
  } catch {
    /* rekaman tetap jalan walau audio terkunci */
  }

  const destination = audioCtx.createMediaStreamDestination();
  const master = audioCtx.createGain();
  master.gain.value = 1;
  master.connect(destination);

  const musicGain = audioCtx.createGain();
  musicGain.gain.value = Math.min(1, Math.max(0, project.music.volume / 100));
  musicGain.connect(master);

  const voiceGain = audioCtx.createGain();
  voiceGain.gain.value = Math.min(1, Math.max(0, project.voiceVolume / 100));
  voiceGain.connect(master);

  let musicBuffer: AudioBuffer | null = null;
  if (project.music.file?.url) {
    try {
      musicBuffer = await fetchAudioBuffer(audioCtx, project.music.file.url);
    } catch {
      warnings.push("Musik latar gagal dimuat");
    }
  }

  const voiceBuffers = new Map<string, AudioBuffer>();
  const voiceClips = clips.filter((clip) => (clip.voiceover ?? "").trim().length > 0);
  report(16, `Menyiapkan voice over (0/${voiceClips.length})…`);

  let voiceDone = 0;
  const concurrency = 3;
  const queue = [...voiceClips];
  const worker = async () => {
    for (;;) {
      const clip = queue.shift();
      if (!clip) return;
      const text = (clip.voiceover ?? "").trim();
      try {
        const url = `/api/tts?${new URLSearchParams({ text, voice: job.voice }).toString()}`;
        voiceBuffers.set(clip.id, await fetchAudioBuffer(audioCtx, url));
      } catch {
        warnings.push(`Voice over scene ${clip.sceneIndex} gagal dibuat`);
      } finally {
        voiceDone += 1;
        report(16 + (voiceDone / Math.max(1, voiceClips.length)) * 14, `Menyiapkan voice over (${voiceDone}/${voiceClips.length})…`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, voiceClips.length)) }, worker));

  if (voiceClips.length > 0 && voiceBuffers.size === 0) {
    warnings.push("Voice over tidak tersedia — video diekspor tanpa narasi");
  }

  if (signal?.aborted) {
    await audioCtx.close();
    throw new Error("Ekspor dibatalkan");
  }

  /* ---------- recorder ---------- */
  const { mime, extension } = pickMime();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    await audioCtx.close();
    throw new Error("Canvas 2D tidak tersedia");
  }

  const canvasStream = canvas.captureStream(FPS);
  const tracks = [...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()];
  const stream = new MediaStream(tracks);

  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  const recording = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  const startedAt = audioCtx.currentTime + 0.18;
  const wallStart = performance.now() + 180;

  /* music loop */
  const musicSource = audioCtx.createBufferSource();
  if (musicBuffer) {
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;
    musicSource.connect(musicGain);
    musicSource.start(startedAt);
    musicSource.stop(startedAt + duration + 0.5);
  }

  /* voice per clip, start tepat di awal klip */
  for (const clip of voiceClips) {
    const buffer = voiceBuffers.get(clip.id);
    if (!buffer) continue;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(voiceGain);
    const when = startedAt + Math.max(0, clip.start);
    const offset = Math.max(0, -clip.start);
    if (offset >= buffer.duration) continue;
    source.start(when, offset);
    source.stop(when + Math.min(buffer.duration - offset, Math.max(0.1, duration - Math.max(0, clip.start))));
  }

  recorder.start(250);
  report(30, "Merender video (real-time)…");

  let aborted = false;
  try {
    await new Promise<void>((resolve) => {
      const drawFrame = () => {
        if (signal?.aborted) {
          aborted = true;
          resolve();
          return;
        }
        const now = performance.now();
        const t = Math.max(0, (now - wallStart) / 1000);
        if (t >= duration) {
          drawTimelineFrame(ctx, Math.max(0, duration - 0.001));
          resolve();
          return;
        }

        drawTimelineFrame(ctx, t);

        const pct = 30 + Math.min(1, t / duration) * 68;
        report(pct, "Merender video (real-time)…");
        requestAnimationFrame(drawFrame);
      };

      const drawTimelineFrame = (context: CanvasRenderingContext2D, t: number) => {
        const clip = activeClipAt(clips, t);
        const scene = clip ? sceneByIndex.get(clip.sceneIndex) : undefined;
        const monochrome = isMonochrome(
          job.prompt,
          job.style,
          clip?.visual,
          scene?.visual,
          scene?.onScreenText,
          scene?.imagePrompt,
        );
        const palette = paletteAt(clip?.sceneIndex ?? 1, monochrome);

        /* background */
        const bg = context.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, palette.from);
        bg.addColorStop(1, palette.to);
        context.fillStyle = bg;
        context.fillRect(0, 0, width, height);

        const glow = context.createRadialGradient(width * 0.32, height * 0.18, 0, width * 0.32, height * 0.18, Math.max(width, height) * 0.8);
        glow.addColorStop(0, hexAlpha(palette.glow, 0.5));
        glow.addColorStop(0.55, hexAlpha(palette.glow, 0.12));
        glow.addColorStop(1, hexAlpha(palette.glow, 0));
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);

        /* subtle grid */
        context.save();
        context.strokeStyle = "rgba(255,255,255,0.06)";
        context.lineWidth = 1;
        const grid = Math.round(width / 14);
        for (let x = 0; x < width; x += grid) {
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, height);
          context.stroke();
        }
        for (let y = 0; y < height; y += grid) {
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(width, y);
          context.stroke();
        }
        context.restore();

        /* media / storyboard */
        let usedStoryboard = false;
        if (clip) {
          const video = videos.get(clip.id);
          const image = images.get(clip.id);
          if (clip.media?.kind === "video" && video) {
            const local = Math.max(0, t - clip.start);
            if (video.readyState >= 2) {
              if (Math.abs(video.currentTime - local) > 0.3) {
                try {
                  video.currentTime = local;
                } catch {
                  /* ignore */
                }
              }
              if (video.paused) void video.play().catch(() => undefined);
              drawCover(context, video, video.videoWidth, video.videoHeight, width, height);
            }
          } else if (clip.media?.kind === "image" && image) {
            drawCover(context, image, image.naturalWidth, image.naturalHeight, width, height);
          } else if (image) {
            usedStoryboard = true;
            drawCover(context, image, image.naturalWidth, image.naturalHeight, width, height);
          }
          /* pause other videos */
          for (const [id, element] of videos) {
            if (id !== clip.id && !element.paused) element.pause();
          }
        }

        /* readability gradient */
        const shade = context.createLinearGradient(0, 0, 0, height);
        shade.addColorStop(0, "rgba(0,0,0,0.45)");
        shade.addColorStop(0.35, "rgba(0,0,0,0.05)");
        shade.addColorStop(0.7, "rgba(0,0,0,0.1)");
        shade.addColorStop(1, "rgba(0,0,0,0.62)");
        context.fillStyle = shade;
        context.fillRect(0, 0, width, height);

        if (!usedStoryboard && clip) {
          const pad = Math.round(width * 0.07);
          context.save();
          context.textAlign = "left";
          context.textBaseline = "top";
          context.font = `700 ${Math.round(width * 0.024)}px "Inter", system-ui, sans-serif`;
          context.fillStyle = "rgba(255,255,255,0.62)";
          context.fillText(
            `SCENE ${String(clip.sceneIndex).padStart(2, "0")} / ${String(Math.max(1, clips.length)).padStart(2, "0")}`,
            pad,
            pad,
          );
          context.font = `600 ${Math.round(width * 0.016)}px "Inter", system-ui, sans-serif`;
          context.fillStyle = palette.accent;
          const pillText = clip.broll.toUpperCase();
          const pillW = context.measureText(pillText).width + width * 0.035;
          const pillH = width * 0.045;
          context.fillStyle = "rgba(0,0,0,0.45)";
          roundRect(context, pad, pad + width * 0.045, pillW, pillH, pillH / 2);
          context.fill();
          context.strokeStyle = hexAlpha(palette.accent, 0.7);
          context.lineWidth = Math.max(1, width * 0.0015);
          context.stroke();
          context.fillStyle = palette.accent;
          context.textBaseline = "middle";
          context.fillText(pillText, pad + width * 0.018, pad + width * 0.045 + pillH / 2);

          const visualLines = wrapCanvasText(context, clip.visual, width * 0.55, 4);
          context.font = `500 ${Math.round(width * 0.022)}px "Inter", system-ui, sans-serif`;
          context.fillStyle = "rgba(255,255,255,0.85)";
          context.textBaseline = "top";
          const startY = height * 0.36;
          visualLines.forEach((line, i) => {
            context.fillText(line, pad, startY + i * width * 0.032);
          });
          context.restore();
        }

        /* overlays + captions */
        for (const overlay of project.overlays) {
          if (t >= overlay.start && t < overlay.end) drawOverlay(context, overlay, palette, width, height);
        }
        if (project.captionsEnabled) {
          const caption = project.captions.find((item) => t >= item.start && t < item.end);
          if (caption) drawCaption(context, caption, t, palette, width, height);
        }

        /* progress bar */
        context.fillStyle = "rgba(255,255,255,0.6)";
        context.fillRect(0, height - Math.max(2, width * 0.003), width * Math.min(1, t / duration), Math.max(2, width * 0.003));
      };

      requestAnimationFrame(drawFrame);
    });
  } finally {
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      /* ignore */
    }
    await recording.catch(() => undefined);
    for (const video of videos.values()) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    try {
      musicSource.stop();
    } catch {
      /* already stopped */
    }
    await audioCtx.close().catch(() => undefined);
    for (const track of stream.getTracks()) track.stop();
  }

  if (aborted) throw new Error("Ekspor dibatalkan");

  report(99, "Menyelesaikan file…");
  const blob = new Blob(chunks, { type: (mime || "video/webm").split(";")[0] });
  if (blob.size < 2000) throw new Error("Hasil ekspor kosong — coba lagi");

  const filename = `${slugify(job.title || "video")}.${extension}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);

  report(100, "Selesai");
  return { blob, filename, extension, mime: mime || "video/webm", warnings, downloadUrl: url };
}
