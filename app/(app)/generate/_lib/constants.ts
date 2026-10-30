import type { AspectRatio } from "../../../types";

export const STYLES = ["cinematic", "fast-cut", "documentary", "motion-graphic", "anime", "screen-record"];
export const VOICES = [
  { id: "female-id", label: "Wanita ID — energik" },
  { id: "male-id", label: "Pria ID — hangat" },
  { id: "female-en", label: "Female EN — bright" },
  { id: "male-en", label: "Male EN — deep" },
];
export const RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1", "4:5"];
export const MODELS = ["studio-v1", "studio-v1-turbo", "cinema-pro"];

// Samakan dengan clampDurationSec di app/lib/jobs.ts (file itu khusus server,
// jadi konstanta diduplikasi di sini agar bisa dipakai komponen client).
export const MIN_DURATION_SEC = 10;
export const MAX_DURATION_SEC = 600; // 10 menit
export const SLIDER_MAX_SEC = 180;

export const IDEAS = [
  "5 kesalahan editing video yang bikin retention drop",
  "Cara riset konten pakai 3 video kompetitor dalam 10 menit",
  "Behind the scenes setup studio rumahan budget 2 juta",
];
