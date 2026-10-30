import type { RefObject } from "react";
import { Upload } from "lucide-react";

type Props = {
  dragActive: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList) => void;
};

export default function EditorImportOverlay({ dragActive, inputRef, onFiles }: Props) {
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*,.mp4,.mov,.webm,.mkv,.mp3,.m4a,.wav,.aac,.ogg,.png,.jpg,.jpeg,.webp,.gif"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) onFiles(files);
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
    </>
  );
}
