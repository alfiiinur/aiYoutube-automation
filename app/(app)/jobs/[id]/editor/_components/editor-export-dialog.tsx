import { Download, Loader2, X } from "lucide-react";
import { exportDimensions } from "@/app/lib/export-video";
import type { EditorProject, VideoJob } from "@/app/types";

type Props = {
  open: boolean;
  job: VideoJob;
  project: EditorProject;
  duration: number;
  exporting: boolean;
  exportPct: number;
  exportPhase: string;
  exportError: string | null;
  exportResult: { extension: string; filename: string; url: string } | null;
  onClose: () => void;
  onStartExport: () => void;
};

export default function EditorExportDialog({
  open,
  job,
  project,
  duration,
  exporting,
  exportPct,
  exportPhase,
  exportError,
  exportResult,
  onClose,
  onStartExport,
}: Props) {
  if (!open) return null;
  const exportSize = exportDimensions(job.aspectRatio);
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !exporting && onClose()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-white">Ekspor video</h2>
            <p className="mt-0.5 text-[10px] text-white/35">Render lokal · MP4/WebM · {job.aspectRatio}</p>
          </div>
          <button
            onClick={() => !exporting && onClose()}
            className="grid size-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Resolusi", `${exportSize.width}×${exportSize.height}`],
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
            {[`${project.captions.length} caption`, `${project.overlays.length} overlay`, project.music.title, `${project.clips.filter((clip) => clip.voiceover?.trim()).length} narasi`, `VO ${project.voiceVolume}%`].map((chip) => (
              <span key={chip} className="rounded-full bg-white/5 px-2 py-0.5 text-[9.5px] text-white/45">
                {chip}
              </span>
            ))}
          </div>

          {(exporting || exportPct > 0 || exportError) && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px]">
                <span className={exportError ? "text-rose-300" : "text-white/45"}>
                  {exportError
                    ? exportError
                    : exportPct >= 100
                      ? "Render selesai"
                      : exportPhase || "Merender frame & mixing audio…"}
                </span>
                <span className="tabular-nums text-white/60">{Math.round(exportPct)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    exportError ? "bg-rose-400" : exportPct >= 100 ? "bg-lime-400" : "bg-white"
                  }`}
                  style={{ width: `${Math.max(2, exportPct)}%` }}
                />
              </div>
            </div>
          )}

          {exportResult && (
            <div className="mt-3 rounded-lg border border-lime-400/25 bg-lime-400/8 px-2.5 py-2 text-[10px] leading-relaxed text-lime-200/90">
              <p>
                File <span className="font-medium">{exportResult.filename}</span> sudah terunduh (
                {exportResult.extension.toUpperCase()}). Kalau unduhan otomatis diblokir browser, klik tombol di bawah.
              </p>
              <a
                href={exportResult.url}
                download={exportResult.filename}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-lime-300 px-2 py-1 text-[10px] font-semibold text-black transition hover:bg-lime-200"
              >
                <Download className="size-3" /> Unduh file
              </a>
            </div>
          )}

          {!exporting && !exportResult && !exportError && (
            <p className="mt-3 text-[9.5px] leading-relaxed text-white/30">
              Proses render berjalan real-time sambil memutar frame dan mencampur voice over + musik. Biarkan tab ini
              tetap aktif sampai unduhan dimulai.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-3">
          <button
            onClick={() => !exporting && onClose()}
            className="rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-[11px] text-white/60 transition hover:text-white"
          >
            {exportPct >= 100 ? "Tutup" : "Batal"}
          </button>
          <button
            onClick={onStartExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {exportPct >= 100 ? "Ekspor ulang" : exporting ? "Merender…" : "Ekspor sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
