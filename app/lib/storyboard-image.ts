import type { AspectRatio, StoryboardScene, VideoJob } from "@/app/types";

/**
 * URL gambar untuk satu scene storyboard.
 *
 * Kalau scene sudah punya `imageUrl` (mis. hasil generate AI di masa depan),
 * pakai itu. Kalau belum, fallback ke API internal yang me-render frame
 * storyboard SVG deterministik — jadi job lama pun langsung dapat gambar
 * tanpa migrasi database.
 */
export function storyboardImageUrl(
  job: Pick<VideoJob, "id" | "aspectRatio" | "style" | "title" | "prompt">,
  scene: StoryboardScene,
  totalScenes?: number,
): string {
  if (scene.imageUrl) return scene.imageUrl;
  const params = new URLSearchParams({
    job: job.id,
    scene: String(scene.index),
    total: String(totalScenes ?? scene.index),
    aspect: job.aspectRatio,
    style: job.style ?? "cinematic",
    title: job.title ?? "",
    prompt: (job.prompt ?? "").slice(0, 400),
    visual: scene.visual ?? "",
    text: scene.onScreenText ?? "",
    broll: scene.broll ?? "",
    timecode: scene.timecode ?? "",
    imagePrompt: scene.imagePrompt ?? "",
  });
  return `/api/storyboard-image?${params.toString()}`;
}

/** Lebar + aspect-ratio thumbnail storyboard sesuai rasio job. */
export function storyboardThumbClass(aspectRatio: AspectRatio): string {
  switch (aspectRatio) {
    case "16:9":
      return "aspect-video w-36 sm:w-44";
    case "1:1":
      return "aspect-square w-24 sm:w-28";
    case "4:5":
      return "aspect-[4/5] w-20 sm:w-24";
    case "9:16":
    default:
      return "aspect-[9/16] w-20 sm:w-24";
  }
}

/** Kelas aspect-ratio Tailwind untuk thumbnail sesuai rasio job. */
export function storyboardAspectClass(aspectRatio: AspectRatio): string {
  switch (aspectRatio) {
    case "16:9":
      return "aspect-video";
    case "1:1":
      return "aspect-square";
    case "4:5":
      return "aspect-[4/5]";
    case "9:16":
    default:
      return "aspect-[9/16]";
  }
}
