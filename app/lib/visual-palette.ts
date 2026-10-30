/**
 * Palet visual untuk frame storyboard & preview editor.
 *
 * Default-nya berwarna (vibrant). Mode hitam-putih hanya aktif kalau prompt,
 * gaya, atau deskripsi scene secara eksplisit memintanya — jadi hasil video
 * tidak lagi otomatis monokrom.
 */

export interface VisualPalette {
  /** Warna awal gradient background. */
  from: string;
  /** Warna akhir gradient background. */
  to: string;
  /** Warna glow / aksen terang. */
  glow: string;
  /** Warna teks aksen. */
  accent: string;
}

export const VIBRANT_PALETTES: VisualPalette[] = [
  { from: "#3b0764", to: "#0b1026", glow: "#a855f7", accent: "#f0abfc" },
  { from: "#0c4a6e", to: "#071e2e", glow: "#22d3ee", accent: "#a5f3fc" },
  { from: "#7c2d12", to: "#1c1006", glow: "#fb923c", accent: "#fed7aa" },
  { from: "#14532d", to: "#04170c", glow: "#4ade80", accent: "#bbf7d0" },
  { from: "#831843", to: "#26060f", glow: "#ec4899", accent: "#fbcfe8" },
  { from: "#1e3a8a", to: "#080f22", glow: "#60a5fa", accent: "#bfdbfe" },
  { from: "#713f12", to: "#1c1400", glow: "#facc15", accent: "#fef08a" },
  { from: "#134e4a", to: "#04211f", glow: "#2dd4bf", accent: "#99f6e4" },
];

export const MONO_PALETTES: VisualPalette[] = [
  { from: "#1b1b1e", to: "#0c0c0e", glow: "#e5e5e5", accent: "#fafafa" },
  { from: "#232326", to: "#101012", glow: "#d4d4d4", accent: "#f5f5f5" },
  { from: "#17171a", to: "#0a0a0b", glow: "#f5f5f5", accent: "#ffffff" },
  { from: "#1e1e21", to: "#0e0e10", glow: "#c9c9ce", accent: "#ececef" },
  { from: "#141416", to: "#09090a", glow: "#dedee3", accent: "#f4f4f5" },
  { from: "#26262b", to: "#131315", glow: "#b9b9c0", accent: "#e4e4e7" },
];

const MONO_RE =
  /(hitam\s*putih|hitam-putih|monokrom|monochrome|greyscale|grayscale|black\s*(and|&)\s*white|black-?white|\bb\s*&\s*w\b|\bnoir\b|tanpa\s+warna|without\s+colou?r|desaturat)/i;

/**
 * Sebutan monokrom yang dinegasikan ("jangan hitam putih", "not black and
 * white") tidak boleh memicu mode monokrom.
 */
const NEGATED_MONO_RE =
  /(jangan|bukan|tanpa|hindari|no|not|avoid)\s+(pakai\s+|pakai\s+gaya\s+|gaya\s+|warna\s+)?(hitam\s*putih|hitam-putih|monokrom|monochrome|greyscale|grayscale|black\s*(and|&)\s*white|black-?white|\bb\s*&\s*w\b|\bnoir\b)/gi;

/** True kalau salah satu teks meminta visual hitam-putih secara eksplisit. */
export function isMonochrome(...texts: Array<string | null | undefined>): boolean {
  return texts.some((text) => {
    if (!text) return false;
    const value = String(text);
    if (!MONO_RE.test(value)) return false;
    /*
     * Kalau semua sebutan monokrom dinegasikan, anggap bukan permintaan
     * monokrom. "tanpa warna" sengaja tidak masuk daftar negasi karena justru
     * berarti desaturasi.
     */
    return MONO_RE.test(value.replace(NEGATED_MONO_RE, " "));
  });
}

/** Palet deterministik untuk scene ke-`index` (1-based). */
export function paletteAt(index: number, monochrome = false): VisualPalette {
  const list = monochrome ? MONO_PALETTES : VIBRANT_PALETTES;
  const n = Math.abs(Math.trunc(index)) || 1;
  return list[(n - 1) % list.length];
}

/** Pilih palet berdasarkan permintaan prompt/gaya/scene. */
export function resolvePalette(
  index: number,
  input: {
    prompt?: string | null;
    style?: string | null;
    visual?: string | null;
    text?: string | null;
    imagePrompt?: string | null;
  },
): VisualPalette {
  return paletteAt(
    index,
    isMonochrome(input.prompt, input.style, input.visual, input.text, input.imagePrompt),
  );
}
