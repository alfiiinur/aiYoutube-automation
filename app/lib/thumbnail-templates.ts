import type { ThumbnailTemplate, VideoJob } from "@/app/types";

export interface ThumbnailTemplateMeta {
  id: ThumbnailTemplate;
  /** Nama tampil di picker. */
  label: string;
  /** Keterangan singkat gaya cover. */
  hint: string;
}

/** Template gaya cover thumbnail. Satu template = satu tema cover. */
export const THUMBNAIL_TEMPLATES: ThumbnailTemplateMeta[] = [
  { id: "bold", label: "Bold", hint: "Judul besar kontras tinggi" },
  { id: "minimal", label: "Minimal", hint: "Bersih, teks kecil" },
  { id: "split", label: "Split", hint: "Panel teks + area visual" },
  { id: "frame", label: "Frame", hint: "Bingkai + badge cover" },
];

export const THUMBNAIL_TEMPLATE_IDS: ThumbnailTemplate[] = THUMBNAIL_TEMPLATES.map((t) => t.id);

export function isThumbnailTemplate(value: unknown): value is ThumbnailTemplate {
  return THUMBNAIL_TEMPLATE_IDS.includes(value as ThumbnailTemplate);
}

export function thumbnailTemplateMeta(template: unknown): ThumbnailTemplateMeta {
  return THUMBNAIL_TEMPLATES.find((t) => t.id === template) ?? THUMBNAIL_TEMPLATES[0];
}

/**
 * URL cover thumbnail: di-render API internal sebagai SVG deterministik
 * dari judul + hook + palet job — jadi tiap job langsung punya cover
 * tanpa upload atau API key.
 */
export function thumbnailImageUrl(
  job: Pick<VideoJob, "id" | "aspectRatio" | "style" | "title" | "prompt" | "hook">,
  template: ThumbnailTemplate,
  scenes: number,
): string {
  const params = new URLSearchParams({
    job: job.id,
    template,
    aspect: job.aspectRatio,
    style: job.style ?? "cinematic",
    title: job.title ?? "",
    hook: job.hook ?? "",
    prompt: (job.prompt ?? "").slice(0, 400),
    scenes: String(Math.max(0, scenes)),
  });
  return `/api/thumbnail?${params.toString()}`;
}
