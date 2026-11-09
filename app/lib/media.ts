/** Filter file picker: video, gambar (termasuk GIF), dan audio. */
export const MEDIA_ACCEPT = "video/*,image/*,audio/*,.gif";

const SUPPORTED_EXT = /\.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|aac|ogg|flac|png|jpe?g|webp|gif|avif)$/i;

export function isSupportedMediaFile(file: File): boolean {
  return /^(video|image|audio)\//.test(file.type) || SUPPORTED_EXT.test(file.name);
}

/**
 * Baca durasi video/audio secara lokal sebelum upload. Gambar = 3.5 detik.
 * Dijamin selalu resolve (fallback 5 detik) agar upload tidak pernah macet.
 */
export function probeMediaDuration(file: File): Promise<number> {
  if (file.type.startsWith("image/")) return Promise.resolve(3.5);
  return new Promise((resolve) => {
    let done = false;
    let url: string | null = null;
    let el: HTMLVideoElement | null = null;
    const timer = setTimeout(() => finish(5), 8000);
    const finish = (value: number) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        if (url) URL.revokeObjectURL(url);
        if (el) {
          el.removeAttribute("src");
          el.load();
        }
      } catch {
        // abaikan — hasil durasi tetap dikembalikan
      }
      resolve(value);
    };
    try {
      url = URL.createObjectURL(file);
      el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        const d = el?.duration ?? 0;
        finish(Number.isFinite(d) && d > 0 ? d : 5);
      };
      el.onerror = () => finish(5);
      el.src = url;
    } catch {
      finish(5);
    }
  });
}

export function formatBytes(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Format detik menjadi m:ss ("0:45"). Kosong bila tidak valid. */
export function formatDuration(sec?: number): string {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return "";
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
