import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  MessageSquare,
  PenLine,
  Save,
  Upload,
} from "lucide-react";

type Props = {
  jobId: string;
  title: string;
  onTitleChange: (value: string) => void;
  steps: { label: string; href: string }[];
  saving: boolean;
  dirty: boolean;
  savedAt: number | null;
  onToggleMobilePanel: () => void;
  onImportClick: () => void;
  importing: boolean;
  onSave: () => void;
  onOpenExport: () => void;
};

export default function EditorTopBar({
  jobId,
  title,
  onTitleChange,
  steps,
  saving,
  dirty,
  savedAt,
  onToggleMobilePanel,
  onImportClick,
  importing,
  onSave,
  onOpenExport,
}: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/8 bg-ink-900/85 px-3 backdrop-blur-xl">
      <Link
        href={`/jobs/${jobId}`}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/8 hover:text-white"
        title="Kembali ke job"
        aria-label="Kembali ke job"
      >
        <ArrowLeft className="size-4" />
      </Link>

      <div className="flex min-w-0 items-center gap-1.5">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
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
        <span className="ml-0.5 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-black">
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
          onClick={onToggleMobilePanel}
          className="grid size-8 place-items-center rounded-lg border border-white/8 bg-white/3 text-white/60 lg:hidden"
          aria-label="Buka chat AI"
        >
          <MessageSquare className="size-4" />
        </button>

        <button
          onClick={onImportClick}
          disabled={importing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-500/10 px-2.5 py-1.5 text-[11px] text-accent-400 transition hover:bg-accent-500/20 disabled:opacity-50"
          title="Impor video, gambar, atau audio"
        >
          {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          <span className="hidden sm:inline">{importing ? "Mengimpor…" : "Media"}</span>
        </button>

        <button
          onClick={onSave}
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
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-black transition hover:bg-white/85"
        >
          <Download className="size-3.5" /> Ekspor video
        </button>
      </div>
    </header>
  );
}
