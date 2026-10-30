import type { CaptionFont, EditorCaption } from "@/app/types";

export interface CaptionFontMeta {
  id: CaptionFont;
  /** Nama tampil di dropdown. */
  label: string;
  /** Keterangan singkat karakter font. */
  hint: string;
  /** CSS variable dari next/font (didefinisikan di app/layout.tsx). */
  variable: string;
  /** Nama family asli (untuk canvas + fallback). */
  family: string;
  fallback: string;
}

/** 6 font yang paling sering dipakai untuk caption video. */
export const CAPTION_FONTS: CaptionFontMeta[] = [
  {
    id: "poppins",
    label: "Poppins",
    hint: "Tren caption TikTok/Reels",
    variable: "--font-cap-poppins",
    family: "Poppins",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    hint: "Bold klasik yang tegas",
    variable: "--font-cap-montserrat",
    family: "Montserrat",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "anton",
    label: "Anton",
    hint: "Condensed super-bold viral",
    variable: "--font-cap-anton",
    family: "Anton",
    fallback: "'Arial Narrow', sans-serif",
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    hint: "Sinematik condensed",
    variable: "--font-cap-bebas",
    family: "Bebas Neue",
    fallback: "'Arial Narrow', sans-serif",
  },
  {
    id: "inter",
    label: "Inter",
    hint: "Bersih dan minimal",
    variable: "--font-cap-inter",
    family: "Inter",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    hint: "Serif elegan",
    variable: "--font-cap-playfair",
    family: "Playfair Display",
    fallback: "Georgia, serif",
  },
];

export const CAPTION_FONT_IDS: CaptionFont[] = CAPTION_FONTS.map((f) => f.id);

export function isCaptionFont(value: unknown): value is CaptionFont {
  return CAPTION_FONT_IDS.includes(value as CaptionFont);
}

export function captionFontMeta(font: unknown): CaptionFontMeta {
  return CAPTION_FONTS.find((f) => f.id === font) ?? CAPTION_FONTS[0];
}

/** Stack font untuk CSS (preview, dropdown, contoh). */
export function captionFontFamily(font: unknown): string {
  const meta = captionFontMeta(font);
  return `var(${meta.variable}), "${meta.family}", ${meta.fallback}`;
}

/** Ketebalan caption mengikuti toggle bold milik user. */
export function captionFontWeight(caption: Pick<EditorCaption, "bold">): number {
  return caption.bold ? 800 : 400;
}

/**
 * Family aktual untuk canvas. next/font memakai nama family hashed,
 * jadi baca nilai computed dari CSS variable; jatuh ke nama asli bila kosong.
 */
export function resolveCanvasFontFamily(font: unknown): string {
  const meta = captionFontMeta(font);
  const plain = `"${meta.family}", ${meta.fallback}`;
  if (typeof document === "undefined") return plain;
  try {
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue(meta.variable)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!computed) return plain;
    return `"${computed}", ${plain}`;
  } catch {
    return plain;
  }
}

/**
 * Pastikan semua kombinasi font caption yang dipakai project sudah
 * termuat sebelum ekspor video, supaya canvas tidak jatuh ke fallback.
 */
export async function ensureCaptionFontsLoaded(
  captions: Pick<EditorCaption, "font" | "bold" | "italic">[],
): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const combos = new Map<string, { family: string; weight: number; italic: boolean }>();
  for (const c of captions) {
    const key = `${String(c.font)}|${c.bold}|${c.italic}`;
    if (!combos.has(key)) {
      combos.set(key, {
        family: resolveCanvasFontFamily(c.font),
        weight: captionFontWeight(c),
        italic: c.italic === true,
      });
    }
  }
  await Promise.allSettled(
    [...combos.values()].map(({ family, weight, italic }) =>
      document.fonts.load(`${italic ? "italic " : ""}${weight} 40px ${family}`, "Ag"),
    ),
  );
}
