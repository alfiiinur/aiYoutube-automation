"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Mic2,
  Music2,
  Play,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Square,
  Upload,
  Wand2,
} from "lucide-react";
import type {
  CaptionPosition,
  CaptionStyle,
  EditorCaption,
  EditorClip,
  EditorMusic,
  EditorOverlay,
  EditorProject,
  EditorSelection,
  OverlayVariant,
  VideoJob,
} from "@/app/types";
import { MUSIC_PRESETS, fmtTime } from "@/app/lib/editor";

export type SideTab = "chat" | "props";

const SUGGESTIONS = [
  "Perpendek caption",
  "Musik lebih tenang",
  "Ganti caption: Ini rahasianya",
  "Tambah overlay “Tips hari ini”",
  "Nyalakan gaya karaoke",
  "Hapus musik",
];

function copyText(text: string) {
  return navigator.clipboard.writeText(text).catch(() => undefined);
}

function CopyFieldBtn({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await copyText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] text-white/40 transition hover:bg-white/8 hover:text-white"
      title="Salin"
    >
      {done ? <Check className="size-3 text-lime-400" /> : <Copy className="size-3" />}
      {done ? "Tersalin" : "Salin"}
    </button>
  );
}

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: typeof Music2;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
          {Icon && <Icon className="size-3.5 text-accent-400" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function LabeledField({
  label,
  value,
  copy,
  children,
}: {
  label: string;
  value?: string;
  copy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-[10px] font-medium text-white/45">{label}</label>
        {copy && value !== undefined && <CopyFieldBtn value={value} />}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/9 bg-ink-950/70 px-2 py-1.5 text-[11.5px] text-white/85 outline-none transition placeholder:text-white/25 focus:border-brand-500/50";

function TimeFields({
  start,
  end,
  duration,
  onChange,
}: {
  start: number;
  end: number;
  duration: number;
  onChange: (patch: { start?: number; end?: number }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <LabeledField label="Mulai (detik)">
        <input
          type="number"
          min={0}
          max={duration}
          step={0.1}
          value={start}
          onChange={(e) => onChange({ start: Math.max(0, Math.min(Number(e.target.value) || 0, end - 0.4)) })}
          className={inputCls}
        />
      </LabeledField>
      <LabeledField label="Selesai (detik)">
        <input
          type="number"
          min={0}
          max={duration}
          step={0.1}
          value={end}
          onChange={(e) => onChange({ end: Math.max(start + 0.4, Math.min(Number(e.target.value) || 0, duration)) })}
          className={inputCls}
        />
      </LabeledField>
    </div>
  );
}

function ChatView({
  project,
  thinking,
  onSend,
}: {
  project: EditorProject;
  thinking: boolean;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [project.chat.length, thinking]);

  const submit = (value?: string) => {
    const text = (value ?? draft).trim();
    if (!text) return;
    setDraft("");
    onSend(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/6 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-white">
            <Sparkles className="size-3.5 text-black" />
          </div>
          <div className="leading-tight">
            <p className="text-[12px] font-semibold text-white/90">AI Editor</p>
            <p className="text-[9px] text-white/35">ngobrol untuk mengubah timeline</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-lime-500/10 px-2 py-0.5 text-[9px] text-lime-300">
          <span className="pulse-dot size-1 rounded-full bg-lime-400" /> aktif
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {project.chat.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[88%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11.5px] leading-relaxed text-black">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2">
              <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-accent-500/15">
                <Sparkles className="size-3 text-accent-400" />
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-white/7 bg-white/[0.045] px-3 py-2 text-[11.5px] leading-relaxed text-white/70">
                {m.text}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-start gap-2">
            <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-accent-500/15">
              <Sparkles className="size-3 text-accent-400" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/7 bg-white/[0.045] px-3 py-2 text-[11px] text-white/40">
              <Loader2 className="size-3 animate-spin" /> Menyesuaikan timeline…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/6 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full border border-white/8 bg-white/3 px-2 py-1 text-[9.5px] text-white/45 transition hover:border-white/16 hover:text-white/80"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-1.5 rounded-xl border border-white/10 bg-ink-950/70 p-1.5 transition focus-within:border-brand-500/50">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Perintah untuk editor…"
            className="max-h-24 min-h-[30px] flex-1 resize-none bg-transparent px-1.5 py-1 text-[11.5px] text-white/85 outline-none placeholder:text-white/25"
          />
          <button
            onClick={() => submit()}
            disabled={!draft.trim() || thinking}
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-black transition hover:bg-white/85 disabled:opacity-35"
            aria-label="Kirim perintah"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[8.5px] text-white/25">
          Enter untuk kirim · Shift+Enter baris baru · perubahan tersimpan saat klik Simpan
        </p>
      </div>
    </div>
  );
}

function ItemProps({
  selection,
  project,
  onUpdateClip,
  onUpdateCaption,
  onUpdateOverlay,
  onSplit,
  onDelete,
}: {
  selection: EditorSelection;
  project: EditorProject;
  onUpdateClip: (id: string, patch: Partial<EditorClip>) => void;
  onUpdateCaption: (id: string, patch: Partial<EditorCaption>) => void;
  onUpdateOverlay: (id: string, patch: Partial<EditorOverlay>) => void;
  onSplit: () => void;
  onDelete: () => void;
}) {
  if (selection.track === "music") return null;

  const clip = selection.track === "clip" ? project.clips.find((c) => c.id === selection.id) : null;
  const caption = selection.track === "caption" ? project.captions.find((c) => c.id === selection.id) : null;
  const overlay = selection.track === "overlay" ? project.overlays.find((o) => o.id === selection.id) : null;
  const itemStart = clip?.start ?? caption?.start ?? overlay?.start ?? 0;

  if (!clip && !caption && !overlay) return null;

  return (
    <Section
      title={
        clip
          ? `Klip · ${fmtTime(itemStart)}`
          : caption
            ? `Caption · ${fmtTime(itemStart)}`
            : `Overlay · ${fmtTime(itemStart)}`
      }
      icon={SlidersHorizontal}
      action={
        <div className="flex gap-1">
          <button
            onClick={onSplit}
            className="rounded-md border border-white/8 px-1.5 py-0.5 text-[9px] text-white/45 transition hover:text-white"
          >
            Potong
          </button>
          <button
            onClick={onDelete}
            className="rounded-md border border-white/8 px-1.5 py-0.5 text-[9px] text-white/45 transition hover:border-brand-500/40 hover:text-brand-400"
          >
            Hapus
          </button>
        </div>
      }
    >
      {clip && (
        <>
          <LabeledField label="Judul klip">
            <input
              value={clip.title}
              onChange={(e) => onUpdateClip(clip.id, { title: e.target.value })}
              className={inputCls}
            />
          </LabeledField>
          <LabeledField label="Deskripsi visual">
            <textarea
              value={clip.visual}
              rows={3}
              onChange={(e) => onUpdateClip(clip.id, { visual: e.target.value })}
              className={`${inputCls} resize-none`}
            />
          </LabeledField>
          <TimeFields
            start={clip.start}
            end={clip.end}
            duration={project.duration}
            onChange={(patch) => onUpdateClip(clip.id, patch)}
          />
        </>
      )}

      {caption && (
        <>
          <LabeledField label="Teks caption" copy value={caption.text}>
            <textarea
              value={caption.text}
              rows={2}
              onChange={(e) => onUpdateCaption(caption.id, { text: e.target.value })}
              className={`${inputCls} resize-none`}
            />
          </LabeledField>
          <div className="grid grid-cols-2 gap-2">
            <LabeledField label="Gaya">
              <select
                value={caption.style}
                onChange={(e) => onUpdateCaption(caption.id, { style: e.target.value as CaptionStyle })}
                className={inputCls}
              >
                <option value="bold" className="bg-ink-900">Bold</option>
                <option value="karaoke" className="bg-ink-900">Karaoke</option>
                <option value="minimal" className="bg-ink-900">Minimal</option>
              </select>
            </LabeledField>
            <LabeledField label="Posisi">
              <select
                value={caption.position}
                onChange={(e) => onUpdateCaption(caption.id, { position: e.target.value as CaptionPosition })}
                className={inputCls}
              >
                <option value="bottom" className="bg-ink-900">Bawah</option>
                <option value="middle" className="bg-ink-900">Tengah</option>
                <option value="top" className="bg-ink-900">Atas</option>
              </select>
            </LabeledField>
          </div>
          <TimeFields
            start={caption.start}
            end={caption.end}
            duration={project.duration}
            onChange={(patch) => onUpdateCaption(caption.id, patch)}
          />
        </>
      )}

      {overlay && (
        <>
          <LabeledField label="Teks overlay" copy value={overlay.text}>
            <textarea
              value={overlay.text}
              rows={2}
              onChange={(e) => onUpdateOverlay(overlay.id, { text: e.target.value })}
              className={`${inputCls} resize-none`}
            />
          </LabeledField>
          <LabeledField label="Jenis">
            <select
              value={overlay.variant}
              onChange={(e) => onUpdateOverlay(overlay.id, { variant: e.target.value as OverlayVariant })}
              className={inputCls}
            >
              <option value="title" className="bg-ink-900">Title card</option>
              <option value="lower-third" className="bg-ink-900">Lower third</option>
              <option value="badge" className="bg-ink-900">Badge / CTA</option>
            </select>
          </LabeledField>
          <TimeFields
            start={overlay.start}
            end={overlay.end}
            duration={project.duration}
            onChange={(patch) => onUpdateOverlay(overlay.id, patch)}
          />
        </>
      )}
    </Section>
  );
}

function VoiceoverEditor({
  clip,
  voice,
  volume,
  onChange,
}: {
  clip: EditorClip;
  voice: string;
  volume: number;
  onChange: (value: string) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume]);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
  };

  const preview = () => {
    const text = (clip.voiceover ?? "").trim();
    if (!text) return;
    stop();
    setState("loading");
    const audio = new Audio(`/api/tts?${new URLSearchParams({ text, voice }).toString()}`);
    audioRef.current = audio;
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    audio.onplaying = () => setState("playing");
    audio.onended = () => setState("idle");
    audio.onerror = () => setState("error");
    void audio.play().then(() => setState("playing")).catch(() => setState("error"));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium text-white/45">Narasi klip (TTS)</label>
        <button
          onClick={state === "playing" || state === "loading" ? stop : preview}
          disabled={!clip.voiceover?.trim()}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/4 px-1.5 py-0.5 text-[9px] text-white/60 transition hover:bg-white/8 hover:text-white disabled:opacity-40"
          title="Dengarkan voice over klip ini"
        >
          {state === "loading" ? (
            <Loader2 className="size-2.5 animate-spin" />
          ) : state === "playing" ? (
            <Square className="size-2.5 fill-current" />
          ) : (
            <Play className="size-2.5" />
          )}
          {state === "playing" ? "Stop" : state === "loading" ? "Memuat…" : "Preview"}
        </button>
      </div>
      <textarea
        value={clip.voiceover ?? ""}
        rows={4}
        placeholder="Tulis narasi yang akan dibacakan untuk klip ini…"
        onChange={(e) => {
          if (state === "playing" || state === "loading") stop();
          onChange(e.target.value);
        }}
        className={`${inputCls} resize-none leading-relaxed`}
      />
      <p className={`text-[9px] ${state === "error" ? "text-rose-300/80" : "text-white/30"}`}>
        {state === "error"
          ? "Gagal memuat suara. Coba lagi sebentar."
          : "Narasi ini otomatis dibacakan di preview dan ikut masuk ke video hasil ekspor."}
      </p>
    </div>
  );
}

export default function SidePanel({
  job,
  project,
  selection,
  tab,
  setTab,
  thinking,
  onSend,
  onUpdateMusic,
  onUpdateVoiceVolume,
  onUpdateClip,
  onUpdateCaption,
  onUpdateOverlay,
  onApplyMusicPreset,
  onGenerateMusic,
  onSplit,
  onDelete,
  onToggleCaptions,
  onAddOverlay,
  onImportMedia,
  importing,
}: {
  job: VideoJob;
  project: EditorProject;
  selection: EditorSelection | null;
  tab: SideTab;
  setTab: (tab: SideTab) => void;
  thinking: boolean;
  onSend: (message: string) => void;
  onUpdateMusic: (patch: Partial<EditorMusic>) => void;
  onUpdateVoiceVolume: (value: number) => void;
  onUpdateClip: (id: string, patch: Partial<EditorClip>) => void;
  onUpdateCaption: (id: string, patch: Partial<EditorCaption>) => void;
  onUpdateOverlay: (id: string, patch: Partial<EditorOverlay>) => void;
  onApplyMusicPreset: (key: keyof typeof MUSIC_PRESETS) => void;
  onGenerateMusic: () => void;
  onSplit: () => void;
  onDelete: () => void;
  onToggleCaptions: () => void;
  onAddOverlay: () => void;
  onImportMedia: () => void;
  importing: boolean;
}) {
  const selectedClip =
    selection?.track === "clip" ? project.clips.find((c) => c.id === selection.id) ?? null : null;

  return (
    <aside className="flex w-[330px] shrink-0 flex-col border-l border-white/8 bg-ink-900/70 backdrop-blur-xl xl:w-[360px]">
      <div className="flex shrink-0 gap-1 border-b border-white/8 p-2">
        <button
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition ${
            tab === "chat" ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
          }`}
        >
          <MessageSquare className="size-3.5" /> Chat AI
        </button>
        <button
          onClick={() => setTab("props")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition ${
            tab === "props" ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
          }`}
        >
          <SlidersHorizontal className="size-3.5" /> Properti
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "chat" ? (
          <ChatView project={project} thinking={thinking} onSend={onSend} />
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {selection ? (
                <ItemProps
                  selection={selection}
                  project={project}
                  onUpdateClip={onUpdateClip}
                  onUpdateCaption={onUpdateCaption}
                  onUpdateOverlay={onUpdateOverlay}
                  onSplit={onSplit}
                  onDelete={onDelete}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-3 text-[10.5px] leading-relaxed text-white/35">
                  <p>
                    Pilih klip, caption, atau overlay di timeline untuk mengedit propertinya. Semua perubahan bisa
                    dibatalkan dengan menutup halaman sebelum menyimpan.
                  </p>
                  <button
                    onClick={onAddOverlay}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-2 py-1 text-[10px] text-white/60 transition hover:bg-white/8 hover:text-white"
                  >
                    <Plus className="size-3" /> Tambah overlay di playhead
                  </button>
                </div>
              )}

              <Section
                title="Prompt musik AI"
                icon={Music2}
                action={<CopyFieldBtn value={`${project.music.prompt}\n\nStyle: ${project.music.style}\nExclude: ${project.music.exclude}`} />}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(MUSIC_PRESETS) as (keyof typeof MUSIC_PRESETS)[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => onApplyMusicPreset(key)}
                      className={`rounded-lg border px-2 py-1 text-[9.5px] capitalize transition ${
                        project.music.style === MUSIC_PRESETS[key].style
                          ? "border-brand-500/40 bg-brand-500/12 text-white"
                          : "border-white/8 bg-white/2 text-white/45 hover:text-white/80"
                      }`}
                    >
                      {key === "lofi" ? "Lo-fi" : key}
                    </button>
                  ))}
                </div>

                {project.music.file && (
                  <div className="flex items-center gap-2 rounded-lg border border-accent-500/25 bg-accent-500/8 px-2 py-1.5">
                    <Music2 className="size-3.5 shrink-0 text-accent-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] text-white/75">{project.music.file.name}</p>
                      <p className="text-[8.5px] uppercase tracking-wide text-accent-400/70">audio impor</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={onImportMedia}
                  disabled={importing}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-2 py-1.5 text-[10px] text-white/60 transition hover:bg-white/8 hover:text-white disabled:opacity-50"
                >
                  {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  {importing ? "Mengimpor…" : "Impor audio / video / gambar"}
                </button>

                <LabeledField label="Prompt musik" copy value={project.music.prompt}>
                  <textarea
                    value={project.music.prompt}
                    rows={4}
                    onChange={(e) => onUpdateMusic({ prompt: e.target.value })}
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                </LabeledField>
                <LabeledField label="Style of music" copy value={project.music.style}>
                  <textarea
                    value={project.music.style}
                    rows={2}
                    onChange={(e) => onUpdateMusic({ style: e.target.value })}
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                </LabeledField>
                <LabeledField label="Exclude styles" copy value={project.music.exclude}>
                  <textarea
                    value={project.music.exclude}
                    rows={2}
                    onChange={(e) => onUpdateMusic({ exclude: e.target.value })}
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                </LabeledField>
                <LabeledField label="Judul lagu" copy value={project.music.title}>
                  <input
                    value={project.music.title}
                    onChange={(e) => onUpdateMusic({ title: e.target.value })}
                    className={inputCls}
                  />
                </LabeledField>
                <LabeledField label="Deskripsi" copy value={project.music.description}>
                  <textarea
                    value={project.music.description}
                    rows={4}
                    onChange={(e) => onUpdateMusic({ description: e.target.value })}
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                </LabeledField>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-white/45">Volume musik</label>
                    <span className="text-[10px] tabular-nums text-white/60">{project.music.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.music.volume}
                    onChange={(e) => onUpdateMusic({ volume: Number(e.target.value) })}
                    className="mt-1.5 w-full accent-brand-500"
                  />
                </div>

                <button
                  onClick={onGenerateMusic}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-500/10 px-2 py-1.5 text-[10.5px] font-medium text-accent-400 transition hover:bg-accent-500/20"
                >
                  <Wand2 className="size-3.5" /> Generate ulang musik
                </button>
              </Section>

              <Section title="Voice over" icon={Mic2}>
                {selectedClip ? (
                  <VoiceoverEditor
                    clip={selectedClip}
                    voice={job.voice}
                    volume={project.voiceVolume}
                    onChange={(value) => onUpdateClip(selectedClip.id, { voiceover: value })}
                  />
                ) : (
                  <p className="rounded-lg border border-dashed border-white/10 px-2 py-2 text-[9.5px] leading-relaxed text-white/35">
                    Pilih klip di timeline untuk mengedit narasi voice over-nya.
                  </p>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-white/45">Volume suara TTS</label>
                    <span className="text-[10px] tabular-nums text-white/60">{project.voiceVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={project.voiceVolume}
                    onChange={(e) => onUpdateVoiceVolume(Number(e.target.value))}
                    className="mt-1.5 w-full accent-brand-500"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/7 bg-white/2 px-2 py-1.5">
                  <div>
                    <p className="text-[10px] text-white/55">Caption otomatis</p>
                    <p className="text-[9px] text-white/30">{project.captions.length} segmen · {job.voice}</p>
                  </div>
                  <button
                    onClick={onToggleCaptions}
                    className={`relative h-4 w-7 rounded-full transition ${project.captionsEnabled ? "bg-lime-500/80" : "bg-white/15"}`}
                    aria-label="Aktifkan caption"
                  >
                    <span
                      className={`absolute top-0.5 size-3 rounded-full bg-white transition ${project.captionsEnabled ? "left-3.5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
