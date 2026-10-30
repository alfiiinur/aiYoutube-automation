import type {
  CaptionPosition,
  CaptionStyle,
  EditorCaption,
  EditorChatMessage,
  EditorClip,
  EditorMusic,
  EditorOverlay,
  EditorProject,
  EditorSelection,
  EditorMedia,
  StoryboardScene,
  VideoJob,
} from "@/app/types";

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const MIN_CLIP = 0.4;
export const MAX_CLIP = 600;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Timeline clips are a single gapless sequence. Keeping every clip butted
 * against the previous one prevents overlaps and empty slots after moving,
 * trimming, splitting, or deleting.
 */
export function reflowClips(clips: EditorClip[]): EditorClip[] {
  let cursor = 0;
  return clips.map((clip) => {
    const length = clamp(round2(clip.end - clip.start), MIN_CLIP, MAX_CLIP);
    const start = round2(cursor);
    const end = round2(start + length);
    cursor = end;
    return { ...clip, start, end };
  });
}

export function clipsEnd(clips: EditorClip[]): number {
  return clips.reduce((max, clip) => Math.max(max, clip.end), 0);
}

/** 00:11.2 */
export function fmtTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const d = Math.floor((safe % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${d}`;
}

/** 0:11 */
export function fmtRuler(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function sceneTiming(
  scene: StoryboardScene,
  index: number,
  count: number,
  duration: number,
): { start: number; end: number } {
  const matches = [...scene.timecode.matchAll(/(\d{1,2}):(\d{2})(?:[.,](\d))?/g)];
  if (matches.length >= 2) {
    const toSec = (m: RegExpMatchArray) =>
      Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 10 : 0);
    const start = toSec(matches[0]);
    const end = toSec(matches[1]);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return { start, end: Math.min(end, duration) };
    }
  }
  const per = duration / Math.max(1, count);
  return { start: index * per, end: Math.min(duration, (index + 1) * per) };
}

function sceneLabel(scene: StoryboardScene, index: number): string {
  const stripped = scene.onScreenText
    .replace(/^(hook|konteks|masalah|solusi|bukti|penerapan|ringkasan|cta)\s*:\s*/i, "")
    .trim();
  if (stripped.length > 0) return stripped.slice(0, 34);
  return `Scene ${index + 1}`;
}

/* ---------------- music ---------------- */

export interface MusicPreset {
  title: string;
  prompt: string;
  style: string;
  exclude: string;
  description: string;
}

export const MUSIC_PRESETS: Record<"calm" | "upbeat" | "cinematic" | "lofi", MusicPreset> = {
  calm: {
    title: "Gentle Mindful Slumber",
    prompt:
      "Musik instrumental tenang dengan piano lembut, light strings, dan pad hangat. Tempo lambat 60 BPM, tanpa vokal, mendukung narasi tanpa mengganggu pembicara.",
    style: "ambient, calm, soft piano, light strings, slow tempo 60 BPM, instrumental",
    exclude: "vocals, choirs, heavy drums, loud instruments",
    description:
      "A calm ambient track featuring soft piano and light strings at a slow 60 BPM. The piece progresses gently from a curious, inviting mood to a relaxed and grounded ending.",
  },
  upbeat: {
    title: "Bright Answers",
    prompt:
      "Musik upbeat yang ringan dan energik. Plucked synth, clap, dan bass groove dengan tempo 120 BPM, tanpa vokal, cocok untuk konten edukasi cepat.",
    style: "upbeat electronic, bright plucks, light percussion, 120 BPM, instrumental",
    exclude: "vocals, aggressive distortion, heavy metal",
    description:
      "A bright, upbeat electronic bed with playful plucks and a light groove. Energik tapi tetap ramah untuk voice over edukasi.",
  },
  cinematic: {
    title: "Quiet Momentum",
    prompt:
      "Skor sinematik minimal dengan piano, sub bass, dan strings yang berkembang perlahan. Tempo 80 BPM, instrumental, membangun rasa penasaran.",
    style: "cinematic, minimal piano, warm strings, subtle percussion, 80 BPM, instrumental",
    exclude: "vocals, EDM drops, harsh synths",
    description:
      "A restrained cinematic score that grows from a single piano note into warm strings and a soft pulse. Memberi ruang untuk narasi tetap dominan.",
  },
  lofi: {
    title: "Late Night Notes",
    prompt:
      "Beat lo-fi santai dengan vinyl crackle, Rhodes, dan drum lembut. Tempo 76 BPM, instrumental, terasa hangat dan fokus.",
    style: "lofi hip hop, dusty vinyl, warm rhodes, soft drums, 76 BPM, instrumental",
    exclude: "vocals, loud vocals, heavy bass drops",
    description:
      "A warm lo-fi loop with vinyl texture and mellow Rhodes chords. Cocok untuk sesi belajar, explainer, dan storytelling santai.",
  },
};

export function pickMusicPreset(mood: string): MusicPreset {
  const m = mood.toLowerCase();
  if (/(calm|tenang|tidur|sleep|ambient|edukasi|soft)/.test(m)) return MUSIC_PRESETS.calm;
  if (/(lofi|lo-fi|fokus|belajar|chill)/.test(m)) return MUSIC_PRESETS.lofi;
  if (/(cinematic|epic|dramatis|film)/.test(m)) return MUSIC_PRESETS.cinematic;
  return MUSIC_PRESETS.upbeat;
}

function defaultMusic(job: VideoJob): EditorMusic {
  const preset = pickMusicPreset(job.musicMood);
  return { ...preset, volume: 72 };
}

/* ---------------- project derivation ---------------- */

export function greetingMessage(job: VideoJob): EditorChatMessage {
  return {
    id: uid("msg"),
    role: "assistant",
    text: `Editor siap untuk “${job.title}”. Aku bisa bantu potong klip, rapikan caption, ganti musik, atau tambah overlay. Coba ketik: “perpendek caption”, “musik lebih tenang”, atau “tambah overlay CTA di akhir”.`,
    at: Date.now(),
  };
}

export function buildDefaultProject(job: VideoJob): EditorProject {
  let duration = Math.max(5, job.durationSec);
  const scenes = job.scenes ?? [];
  const count = Math.max(1, scenes.length);

  let clips: EditorClip[] = reflowClips(
    scenes.map((scene, i) => {
      const { start, end } = sceneTiming(scene, i, count, duration);
      return {
        id: uid("clip"),
        sceneIndex: scene.index || i + 1,
        start,
        end,
        title: sceneLabel(scene, i),
        visual: scene.visual,
        broll: scene.broll,
        voiceover: scene.voiceover,
      };
    }),
  );

  // Media yang diimpor dari halaman Generate: visual jadi klip tambahan,
  // audio pertama jadi musik latar.
  const attached = job.media ?? [];
  const firstAudio = attached.find((m) => m.kind === "audio");
  const attachedVisuals = attached.filter((m) => m.kind !== "audio");
  if (attachedVisuals.length > 0) {
    let sceneIndex = clips.reduce((max, clip) => Math.max(max, clip.sceneIndex), 0);
    const extra: EditorClip[] = attachedVisuals.map((m, i) => {
      const length = m.kind === "image" ? 3.5 : clamp(m.duration ?? 5, 1, MAX_CLIP);
      sceneIndex += 1;
      return {
        id: uid("clip"),
        sceneIndex,
        start: 0,
        end: length,
        title: m.name.replace(/\.[^.]+$/, "").slice(0, 34) || `Media ${i + 1}`,
        visual: `Media impor: ${m.name}`,
        broll: m.kind === "video" ? "video" : "gambar",
        media: m,
      };
    });
    clips = reflowClips([...clips, ...extra]);
    duration = Math.max(duration, clipsEnd(clips));
  }

  const captions: EditorCaption[] = clips.map((clip, i) => {
    const scene = scenes[i];
    return {
      id: uid("cap"),
      start: clip.start,
      end: clip.end,
      text: scene?.onScreenText || clip.title,
      style: "bold",
      position: "bottom",
    };
  });

  const overlays: EditorOverlay[] = [];
  if (duration >= 6) {
    overlays.push({
      id: uid("ov"),
      start: 0.3,
      end: Math.min(3.8, duration / 2),
      text: job.title.toUpperCase(),
      variant: "title",
    });
    overlays.push({
      id: uid("ov"),
      start: Math.max(0, duration - 4),
      end: duration,
      text: "Follow untuk part berikutnya →",
      variant: "badge",
    });
  }

  return {
    version: 1,
    duration,
    clips,
    captions,
    overlays,
    music: firstAudio
      ? {
          ...defaultMusic(job),
          title: firstAudio.name.replace(/\.[^.]+$/, "").slice(0, 42) || "Musik impor",
          file: firstAudio,
        }
      : defaultMusic(job),
    voiceVolume: 88,
    captionsEnabled: true,
    chat: [greetingMessage(job)],
    updatedAt: Date.now(),
  };
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function safeMedia(value: unknown): EditorMedia | undefined {
  if (!value || typeof value !== "object") return undefined;
  const media = value as Partial<EditorMedia>;
  if (typeof media.url !== "string" || !media.url) return undefined;
  const kind = media.kind === "video" || media.kind === "image" || media.kind === "audio" ? media.kind : null;
  if (!kind) return undefined;
  return {
    url: media.url,
    name: String(media.name ?? "Media"),
    kind,
    mime: String(media.mime ?? ""),
    size: typeof media.size === "number" && Number.isFinite(media.size) ? media.size : undefined,
  };
}

/** Merge a saved editor project with the latest job defaults so older saves keep working. */
export function normalizeProject(saved: EditorProject | undefined, job: VideoJob): EditorProject {
  const base = buildDefaultProject(job);
  if (!saved || typeof saved !== "object") return base;

  const timelineDuration = Math.max(base.duration, safeNumber(saved.duration, base.duration));

  const clips = Array.isArray(saved.clips)
    ? reflowClips(
        saved.clips.map((c, i) => {
          const sceneIndex = safeNumber(c.sceneIndex, i + 1);
          const scene = job.scenes?.find((s) => s.index === sceneIndex);
          return {
            id: String(c.id || uid("clip")),
            sceneIndex,
            start: clamp(safeNumber(c.start, i), 0, timelineDuration),
            end: clamp(safeNumber(c.end, i + 1), 0.3, timelineDuration),
            title: String(c.title || `Scene ${i + 1}`),
            visual: String(c.visual || ""),
            broll: String(c.broll || "b-roll"),
            voiceover: String(c.voiceover ?? "").slice(0, 600) || scene?.voiceover || "",
            media: safeMedia(c.media),
          };
        }),
      )
    : base.clips;

  const captions = Array.isArray(saved.captions)
    ? saved.captions.map((c, i) => {
        const start = clamp(safeNumber(c.start, i), 0, Math.max(0, timelineDuration - 0.3));
        return {
          id: String(c.id || uid("cap")),
          start,
          end: clamp(safeNumber(c.end, start + 1), start + 0.3, timelineDuration),
          text: String(c.text || ""),
          style: (["bold", "karaoke", "minimal"] as const).includes(c.style) ? c.style : "bold",
          position: (["top", "middle", "bottom"] as const).includes(c.position) ? c.position : "bottom",
        };
      })
    : base.captions;

  const overlays = Array.isArray(saved.overlays)
    ? saved.overlays.map((o, i) => {
        const start = clamp(safeNumber(o.start, i), 0, Math.max(0, timelineDuration - 0.3));
        return {
          id: String(o.id || uid("ov")),
          start,
          end: clamp(safeNumber(o.end, start + 1), start + 0.3, timelineDuration),
          text: String(o.text || ""),
          variant: (["title", "lower-third", "badge"] as const).includes(o.variant) ? o.variant : "title",
        };
      })
    : base.overlays;

  const chat = Array.isArray(saved.chat) && saved.chat.length
    ? saved.chat.slice(-40).map((m, i) => ({
        id: String(m.id || `msg_${i}`),
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        text: String(m.text || "").slice(0, 2000),
        at: safeNumber(m.at, Date.now()),
      }))
    : base.chat;

  const savedMusic = saved.music && typeof saved.music === "object" ? saved.music : null;
  const musicFile = safeMedia(savedMusic?.file) ?? base.music.file;

  const longestEnd = Math.max(
    timelineDuration,
    clipsEnd(clips),
    ...captions.map((c) => c.end),
    ...overlays.map((o) => o.end),
  );

  return {
    ...base,
    ...saved,
    version: 1,
    duration: longestEnd,
    clips,
    captions,
    overlays,
    music: { ...base.music, ...(savedMusic ?? {}), file: musicFile },
    voiceVolume: clamp(safeNumber(saved.voiceVolume, base.voiceVolume), 0, 100),
    captionsEnabled: saved.captionsEnabled !== false,
    chat,
    updatedAt: safeNumber(saved.updatedAt, Date.now()),
  };
}

/* ---------------- editing helpers ---------------- */

export function shortenText(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function splitTextByRatio(text: string, ratio: number): [string, string] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text, ""];
  const cut = clamp(Math.round(words.length * ratio), 1, words.length - 1);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

export function splitEditorItem(
  project: EditorProject,
  selection: EditorSelection | null,
  at: number,
): { project: EditorProject; reply: string; changed: boolean } {
  if (!selection) {
    return {
      project,
      reply: "Pilih klip, caption, atau overlay dulu, lalu letakkan playhead di tengah item yang mau dipotong.",
      changed: false,
    };
  }
  if (selection.track === "music") {
    return { project, reply: "Track musik tidak bisa dipotong per bagian. Kamu bisa mengganti lagu atau mengatur volumenya.", changed: false };
  }

  if (selection.track === "clip") {
    const item = project.clips.find((c) => c.id === selection.id);
    if (!item || at <= item.start + 0.25 || at >= item.end - 0.25) {
      return { project, reply: "Playhead harus berada di dalam klip (bukan di tepinya) supaya bisa dipotong.", changed: false };
    }
    const second: EditorClip = { ...item, id: uid("clip"), start: at };
    const clips = project.clips.flatMap((c) => (c.id === item.id ? [{ ...c, end: at }, second] : [c]));
    return {
      project: { ...project, clips: reflowClips(clips), updatedAt: Date.now() },
      reply: `Klip “${item.title}” dipotong di ${fmtTime(at)}. Sekarang ada dua klip terpisah.`,
      changed: true,
    };
  }

  if (selection.track === "caption") {
    const item = project.captions.find((c) => c.id === selection.id);
    if (!item || at <= item.start + 0.25 || at >= item.end - 0.25) {
      return { project, reply: "Letakkan playhead di dalam caption yang mau dipotong.", changed: false };
    }
    const [left, right] = splitTextByRatio(item.text, (at - item.start) / (item.end - item.start));
    const second: EditorCaption = { ...item, id: uid("cap"), start: at, text: right || item.text };
    const captions = project.captions.flatMap((c) =>
      c.id === item.id ? [{ ...c, end: at, text: left || item.text }, second] : [c],
    );
    return {
      project: { ...project, captions, updatedAt: Date.now() },
      reply: `Caption dipotong di ${fmtTime(at)} menjadi dua bagian.`,
      changed: true,
    };
  }

  const item = project.overlays.find((o) => o.id === selection.id);
  if (!item || at <= item.start + 0.25 || at >= item.end - 0.25) {
    return { project, reply: "Letakkan playhead di dalam overlay yang mau dipotong.", changed: false };
  }
  const second: EditorOverlay = { ...item, id: uid("ov"), start: at };
  const overlays = project.overlays.flatMap((o) => (o.id === item.id ? [{ ...o, end: at }, second] : [o]));
  return {
    project: { ...project, overlays, updatedAt: Date.now() },
    reply: `Overlay dipotong di ${fmtTime(at)}.`,
    changed: true,
  };
}

export function removeEditorItem(
  project: EditorProject,
  selection: EditorSelection | null,
): { project: EditorProject; reply: string; changed: boolean } {
  if (!selection) {
    return { project, reply: "Pilih item di timeline dulu supaya aku bisa menghapusnya.", changed: false };
  }
  if (selection.track === "clip") {
    const item = project.clips.find((c) => c.id === selection.id);
    if (!item) return { project, reply: "Item tidak ditemukan.", changed: false };
    return {
      project: { ...project, clips: reflowClips(project.clips.filter((c) => c.id !== item.id)), updatedAt: Date.now() },
      reply: `Klip “${item.title}” dihapus dari timeline.`,
      changed: true,
    };
  }
  if (selection.track === "caption") {
    const item = project.captions.find((c) => c.id === selection.id);
    if (!item) return { project, reply: "Item tidak ditemukan.", changed: false };
    return {
      project: { ...project, captions: project.captions.filter((c) => c.id !== item.id), updatedAt: Date.now() },
      reply: "Caption dihapus.",
      changed: true,
    };
  }
  if (selection.track === "overlay") {
    const item = project.overlays.find((o) => o.id === selection.id);
    if (!item) return { project, reply: "Item tidak ditemukan.", changed: false };
    return {
      project: { ...project, overlays: project.overlays.filter((o) => o.id !== item.id), updatedAt: Date.now() },
      reply: "Overlay dihapus.",
      changed: true,
    };
  }
  return {
    project: { ...project, music: { ...project.music, volume: 0 }, updatedAt: Date.now() },
    reply: "Volume musik aku set ke 0. Musik masih ada di track, tinggal naikkan lagi kalau berubah pikiran.",
    changed: true,
  };
}

/* ---------------- chat command engine ---------------- */

export interface CommandContext {
  playhead: number;
  selection: EditorSelection | null;
}

export interface CommandResult {
  project: EditorProject;
  reply: string;
  changed: boolean;
  select?: EditorSelection;
}

export function runEditorCommand(raw: string, project: EditorProject, ctx: CommandContext): CommandResult {
  const text = raw.trim();
  const q = text.toLowerCase();
  if (!text) return { project, reply: "Tulis perintah dulu, ya.", changed: false };

  const commit = (next: EditorProject, reply: string, select?: EditorSelection): CommandResult => ({
    project: { ...next, updatedAt: Date.now() },
    reply,
    changed: true,
    select,
  });

  /* captions */
  if (/(hapus|matikan|hilangkan|nonaktifkan).*(caption|subtitle|teks)/.test(q)) {
    return commit({ ...project, captionsEnabled: false }, "Semua caption aku nonaktifkan. Bilang “nyalakan caption” kalau mau muncul lagi.");
  }
  if (/(nyalakan|aktifkan|tampilkan).*(caption|subtitle|teks)/.test(q)) {
    return commit({ ...project, captionsEnabled: true }, "Caption sudah aktif kembali.");
  }
  if (/(caption|subtitle|teks).*(singkat|pendek|ringkas)|(singkat|pendek|ringkas).*(caption|subtitle|teks)/.test(q)) {
    const captions = project.captions.map((c) => ({ ...c, text: shortenText(c.text, 5) }));
    return commit({ ...project, captions }, "Caption aku ringkas jadi maksimal 5 kata per segmen supaya lebih cepat dibaca di layar kecil.");
  }
  if (/(caption|subtitle|teks).*(gaya|style)|(gaya|style).*(karaoke|minimal|bold)/.test(q)) {
    const style: CaptionStyle = /karaoke/.test(q) ? "karaoke" : /minimal/.test(q) ? "minimal" : "bold";
    const captions = project.captions.map((c) => ({ ...c, style }));
    return commit({ ...project, captions, captionsEnabled: true }, `Gaya caption diubah ke “${style}” untuk semua segmen.`);
  }
  if (/(caption|subtitle|teks).*(tengah|middle)/.test(q)) {
    const position: CaptionPosition = "middle";
    const captions = project.captions.map((c) => ({ ...c, position }));
    return commit({ ...project, captions }, "Posisi caption dipindah ke tengah frame.");
  }
  if (/(caption|subtitle|teks).*(atas|top)/.test(q)) {
    const position: CaptionPosition = "top";
    const captions = project.captions.map((c) => ({ ...c, position }));
    return commit({ ...project, captions }, "Posisi caption dipindah ke atas frame.");
  }
  if (/(caption|subtitle|teks).*(bawah|bottom)/.test(q)) {
    const position: CaptionPosition = "bottom";
    const captions = project.captions.map((c) => ({ ...c, position }));
    return commit({ ...project, captions }, "Posisi caption kembali ke bawah frame.");
  }

  const captionSet = text.match(/caption[^:"“”=]*[:=]\s*["“']?(.+?)["”']?$/i);
  if (captionSet) {
    const value = captionSet[1].trim();
    const active = project.captions.find((c) => ctx.playhead >= c.start && ctx.playhead < c.end);
    const target = ctx.selection?.track === "caption"
      ? project.captions.find((c) => c.id === ctx.selection?.id)
      : active ?? project.captions[0];
    if (!target) return { project, reply: "Belum ada caption di timeline.", changed: false };
    const captions = project.captions.map((c) => (c.id === target.id ? { ...c, text: value } : c));
    return commit({ ...project, captions, captionsEnabled: true }, `Caption di ${fmtTime(target.start)} aku ganti jadi “${value}”.`, {
      track: "caption",
      id: target.id,
    });
  }

  /* music */
  if (/(musik|music|lagu|audio)/.test(q)) {
    if (/(hapus|matikan|hilangkan|tanpa)/.test(q)) {
      return commit({ ...project, music: { ...project.music, volume: 0 } }, "Musik aku matikan (volume 0). Track tetap ada di timeline.");
    }
    const preset =
      /(tenang|calm|pelan|lambat|tidur|sleep|ambient|sedih)/.test(q)
        ? MUSIC_PRESETS.calm
        : /(lofi|lo-fi|fokus|belajar|chill)/.test(q)
          ? MUSIC_PRESETS.lofi
          : /(cinematic|epic|dramatis|film|sinematik)/.test(q)
            ? MUSIC_PRESETS.cinematic
            : /(upbeat|energik|semangat|cepat|drop|ceria)/.test(q)
              ? MUSIC_PRESETS.upbeat
              : null;

    if (preset) {
      return commit(
        { ...project, music: { ...preset, volume: project.music.volume || 72, file: undefined } },
        `Musik diganti ke “${preset.title}” — ${preset.style}. Prompt dan deskripsi di tab Properti ikut diperbarui.`,
      );
    }
    if (/(ganti|ubah|buat|generate)/.test(q)) {
      const next = project.music.style === MUSIC_PRESETS.upbeat.style ? MUSIC_PRESETS.cinematic : MUSIC_PRESETS.upbeat;
      return commit(
        { ...project, music: { ...next, volume: project.music.volume || 72, file: undefined } },
        `Aku buat variasi musik baru: “${next.title}” dengan gaya ${next.style}.`,
      );
    }
    return {
      project,
      reply: "Mau musik seperti apa? Pilihannya: lebih tenang, lebih upbeat, cinematic, atau lo-fi. Kamu juga bisa atur volume di tab Properti.",
      changed: false,
    };
  }

  /* overlays */
  if (/overlay/.test(q)) {
    if (/(hapus|hilangkan|matikan)/.test(q)) {
      const active = project.overlays.find((o) => ctx.playhead >= o.start && ctx.playhead < o.end);
      const target = ctx.selection?.track === "overlay"
        ? project.overlays.find((o) => o.id === ctx.selection?.id)
        : active;
      if (!target) return { project, reply: "Tidak ada overlay aktif di posisi playhead.", changed: false };
      return commit(
        { ...project, overlays: project.overlays.filter((o) => o.id !== target.id) },
        "Overlay di playhead dihapus.",
      );
    }
    if (/(tambah|buat|tulis|pasang|taruh)/.test(q)) {
      const quoted = text.match(/["“'](.+?)["”']/);
      const atEnd = /(akhir|terakhir|\bend\b)/.test(q);
      const start = clamp(atEnd ? Math.max(0, project.duration - 4) : ctx.playhead, 0, Math.max(0, project.duration - 1));
      const end = clamp(start + 4, start + 1, project.duration);
      const overlay: EditorOverlay = {
        id: uid("ov"),
        start,
        end,
        text: quoted?.[1] ?? (/cta|follow|subscribe/.test(q) ? "Follow untuk part berikutnya →" : "Teks overlay baru"),
        variant: /cta|follow|subscribe/.test(q) ? "badge" : /lower|bawah/.test(q) ? "lower-third" : "title",
      };
      return commit(
        { ...project, overlays: [...project.overlays, overlay] },
        `Overlay “${overlay.text}” ditambahkan di ${fmtTime(start)} selama ${(end - start).toFixed(1)} detik.`,
        { track: "overlay", id: overlay.id },
      );
    }
    return {
      project,
      reply: "Tulis teks overlay dalam tanda kutip, contoh: tambah overlay “Tips hari ini” — atau sebut “CTA” untuk menambahkan ajakan follow.",
      changed: false,
    };
  }

  /* split / remove / trim */
  if (/(potong|split|belah)/.test(q)) {
    return splitEditorItem(project, ctx.selection, ctx.playhead);
  }
  if (/(hapus|delete|buang)/.test(q)) {
    return removeEditorItem(project, ctx.selection);
  }
  if (/(perpanjang|panjangkan|tambah durasi)/.test(q) && ctx.selection) {
    if (ctx.selection.track === "caption") {
      const captions = project.captions.map((c) =>
        c.id === ctx.selection?.id ? { ...c, end: clamp(c.end + 1.5, c.start + 0.5, project.duration) } : c,
      );
      return commit({ ...project, captions }, "Durasi caption ditambah 1,5 detik.");
    }
    if (ctx.selection.track === "clip") {
      const clips = project.clips.map((c) =>
        c.id === ctx.selection?.id ? { ...c, end: clamp(c.end + 2, c.start + 0.5, project.duration) } : c,
      );
      return commit({ ...project, clips: reflowClips(clips) }, "Durasi klip ditambah 2 detik.");
    }
  }
  if (/(pendekkan|pangkas|perpendek)/.test(q) && ctx.selection) {
    if (ctx.selection.track === "caption") {
      const captions = project.captions.map((c) =>
        c.id === ctx.selection?.id ? { ...c, end: clamp(c.end - 1, c.start + 0.5, project.duration) } : c,
      );
      return commit({ ...project, captions }, "Durasi caption dikurangi 1 detik.");
    }
    if (ctx.selection.track === "clip") {
      const clips = project.clips.map((c) =>
        c.id === ctx.selection?.id ? { ...c, end: clamp(c.end - 2, c.start + 0.5, project.duration) } : c,
      );
      return commit({ ...project, clips: reflowClips(clips) }, "Durasi klip dikurangi 2 detik.");
    }
  }

  /* voice */
  if (/(voice|suara|tts|narasi)/.test(q)) {
    if (/(naik|besar|keras|tinggi)/.test(q)) {
      const volume = clamp(project.voiceVolume + 10, 0, 100);
      return commit({ ...project, voiceVolume: volume }, `Volume voice over dinaikkan ke ${volume}%.`);
    }
    if (/(turun|kecil|pelan|rendah|halus)/.test(q)) {
      const volume = clamp(project.voiceVolume - 10, 0, 100);
      return commit({ ...project, voiceVolume: volume }, `Volume voice over diturunkan ke ${volume}%.`);
    }
    return commit({ ...project, voiceVolume: 88 }, "Volume voice over aku set ke 88%.");
  }

  return {
    project,
    reply:
      "Aku belum yakin maksudnya. Coba perintah seperti: “perpendek caption”, “musik lebih tenang”, “ganti caption: Ini rahasianya”, “tambah overlay ‘Tips’ di sini”, atau “potong klip di playhead”.",
    changed: false,
  };
}
