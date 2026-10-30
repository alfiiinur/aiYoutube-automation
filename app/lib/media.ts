/** Filter file picker: video, gambar (termasuk GIF), dan audio. */
export const MEDIA_ACCEPT = "video/*,image/*,audio/*,.gif";

const SUPPORTED_EXT = /\.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|aac|ogg|flac|png|jpe?g|webp|gif|avif)$/i;

export function isSupportedMediaFile(file: File): boolean {
  return /^(video|image|audio)\//.test(file.type) || SUPPORTED_EXT.test(file.name);
}

/** Baca durasi video/audio secara lokal sebelum upload. Gambar = 3.5 detik. */
export function probeMediaDuration(file: File): Promise<number> {
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

export function formatBytes(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
