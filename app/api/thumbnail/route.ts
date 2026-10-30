import { NextResponse } from "next/server";
import { isMonochrome, paletteAt, type VisualPalette } from "@/app/lib/visual-palette";
import { isThumbnailTemplate } from "@/app/lib/thumbnail-templates";
import type { ThumbnailTemplate } from "@/app/types";

export const dynamic = "force-dynamic";

function dims(aspect: string): { w: number; h: number } {
  switch (aspect) {
    case "16:9":
      return { w: 960, h: 540 };
    case "1:1":
      return { w: 720, h: 720 };
    case "4:5":
      return { w: 720, h: 900 };
    case "9:16":
    default:
      return { w: 540, h: 960 };
  }
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bungkus teks ke beberapa baris dengan batas karakter per baris. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, maxChars - 1))}…`;
  }
  return lines;
}

/** Hash string sederhana untuk memilih palet yang stabil per job. */
function hashStr(text: string): number {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}

const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

interface CoverInput {
  w: number;
  h: number;
  pad: number;
  scale: number;
  palette: VisualPalette;
  title: string;
  hook: string;
  style: string;
  scenes: number;
}

function background(c: CoverInput): string {
  const { w, h, palette } = c;
  return (
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${palette.from}"/><stop offset="1" stop-color="${palette.to}"/>` +
    `</linearGradient>` +
    `<radialGradient id="glow" cx="0.3" cy="0.15" r="0.7">` +
    `<stop offset="0" stop-color="${palette.glow}" stop-opacity="0.35"/><stop offset="0.6" stop-color="${palette.glow}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">` +
    `<path d="M26 0H0v26" fill="none" stroke="#ffffff" stroke-opacity="0.07"/>` +
    `</pattern>` +
    `</defs>` +
    `<rect width="${w}" height="${h}" fill="url(#bg)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#glow)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#grid)"/>`
  );
}

function kicker(c: CoverInput, x: number, y: number, anchor = "start"): string {
  const { scale, scenes } = c;
  const text = scenes > 0 ? `COVER • ${scenes} SCENE` : "COVER";
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${SANS}" font-size="${Math.round(17 * scale)}" font-weight="700" letter-spacing="3" fill="#ffffff" opacity="0.55">${esc(text)}</text>`;
}

/** Bold: judul raksasa kontras tinggi di bawah. */
function renderBold(c: CoverInput): string {
  const { w, h, pad, scale, palette, title, hook } = c;
  const lines = wrap(title.toUpperCase() || "TANPA JUDUL", 16, 3);
  const titleSize = Math.round(46 * scale);
  const lineHeight = Math.round(54 * scale);
  const titleStartY = Math.round(h * 0.52);
  const hookLine = hook ? wrap(hook, 34, 1)[0] ?? "" : "";
  return (
    `<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.72"/>` +
    `</linearGradient>` +
    `<rect y="${Math.round(h * 0.38)}" width="${w}" height="${Math.round(h * 0.62)}" fill="url(#scrim)"/>` +
    kicker(c, pad, pad + Math.round(18 * scale)) +
    `<rect x="${pad}" y="${titleStartY - Math.round(36 * scale)}" width="${Math.round(64 * scale)}" height="${Math.round(8 * scale)}" rx="${Math.round(4 * scale)}" fill="${palette.accent}"/>` +
    lines
      .map(
        (line, i) =>
          `<text x="${pad}" y="${titleStartY + i * lineHeight}" font-family="${SANS}" font-size="${titleSize}" font-weight="800" fill="#ffffff">${esc(line)}</text>`,
      )
      .join("") +
    (hookLine
      ? `<text x="${pad}" y="${titleStartY + lines.length * lineHeight + Math.round(6 * scale)}" font-family="${SANS}" font-size="${Math.round(20 * scale)}" fill="#ffffff" opacity="0.8">${esc(hookLine)}</text>`
      : ``)
  );
}

/** Minimal: teks kecil rapi, ruang visual lega. */
function renderMinimal(c: CoverInput): string {
  const { pad, scale, palette, title, hook, style } = c;
  const lines = wrap(title || "Tanpa judul", 26, 2);
  const titleY = pad + Math.round(44 * scale) + Math.round(40 * scale);
  const hookLine = hook ? wrap(hook, 40, 1)[0] ?? "" : "";
  return (
    kicker(c, pad, pad + Math.round(18 * scale)) +
    `<rect x="${pad}" y="${pad + Math.round(36 * scale)}" width="${Math.round(40 * scale)}" height="${Math.round(3 * scale)}" fill="${palette.accent}"/>` +
    lines
      .map(
        (line, i) =>
          `<text x="${pad}" y="${titleY + i * Math.round(32 * scale)}" font-family="${SANS}" font-size="${Math.round(24 * scale)}" font-weight="700" fill="#ffffff" opacity="0.92">${esc(line)}</text>`,
      )
      .join("") +
    (hookLine
      ? `<text x="${pad}" y="${titleY + lines.length * Math.round(32 * scale) + Math.round(8 * scale)}" font-family="${SANS}" font-size="${Math.round(16 * scale)}" fill="#ffffff" opacity="0.6">${esc(hookLine)}</text>`
      : ``) +
    `<text x="${pad}" y="${c.h - pad}" font-family="${SANS}" font-size="${Math.round(14 * scale)}" font-weight="600" letter-spacing="2" fill="#ffffff" opacity="0.4">${esc(style.toUpperCase() || "STUDIO")}</text>`
  );
}

/** Split: panel teks kiri + area visual kanan dengan tombol putar. */
function renderSplit(c: CoverInput): string {
  const { w, h, pad, scale, palette, title, hook } = c;
  const panelW = Math.round(w * 0.46);
  const tx = Math.round(pad * 0.7);
  const lines = wrap(title.toUpperCase() || "TANPA JUDUL", 10, 3);
  const titleSize = Math.round(30 * scale);
  const lineHeight = Math.round(38 * scale);
  const titleY = Math.round(h * 0.3) + Math.round(40 * scale);
  const hookLines = hook ? wrap(hook, 16, 2) : [];
  const cx = Math.round(w * 0.73);
  const cy = Math.round(h * 0.5);
  const r = Math.round(64 * scale);
  const tri = Math.round(26 * scale);
  return (
    `<rect width="${panelW}" height="${h}" fill="#000000" opacity="0.55"/>` +
    `<rect width="${Math.round(6 * scale)}" height="${h}" fill="${palette.accent}"/>` +
    kicker(c, tx, Math.round(h * 0.3)) +
    lines
      .map(
        (line, i) =>
          `<text x="${tx}" y="${titleY + i * lineHeight}" font-family="${SANS}" font-size="${titleSize}" font-weight="800" fill="#ffffff">${esc(line)}</text>`,
      )
      .join("") +
    hookLines
      .map(
        (line, i) =>
          `<text x="${tx}" y="${titleY + lines.length * lineHeight + Math.round(10 * scale) + i * Math.round(24 * scale)}" font-family="${SANS}" font-size="${Math.round(16 * scale)}" fill="#ffffff" opacity="0.7">${esc(line)}</text>`,
      )
      .join("") +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#000000" opacity="0.45"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.62)}" fill="${palette.accent}"/>` +
    `<polygon points="${cx - Math.round(tri * 0.4)},${cy - tri} ${cx - Math.round(tri * 0.4)},${cy + tri} ${cx + tri},${cy}" fill="#0a0a0b"/>`
  );
}

/** Frame: bingkai inset + badge + judul tengah. */
function renderFrame(c: CoverInput): string {
  const { w, h, pad, scale, palette, title, hook, style, scenes } = c;
  const inset = Math.round(pad * 0.6);
  const lines = wrap(title.toUpperCase() || "TANPA JUDUL", 14, 3);
  const titleSize = Math.round(40 * scale);
  const lineHeight = Math.round(48 * scale);
  const titleY = Math.round(h * 0.42);
  const hookLines = hook ? wrap(hook, 28, 2) : [];
  const pillW = Math.round(110 * scale);
  const pillH = Math.round(34 * scale);
  const pillY = inset + Math.round(28 * scale);
  const footer = `${scenes > 0 ? `${scenes} SCENE • ` : ""}${(style || "studio").toUpperCase()}`;
  return (
    `<rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${Math.round(18 * scale)}" fill="#000000" opacity="0.25" stroke="#ffffff" stroke-opacity="0.25" stroke-width="${Math.round(2 * scale)}"/>` +
    `<rect x="${Math.round(w / 2 - pillW / 2)}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="#000000" opacity="0.5"/>` +
    `<rect x="${Math.round(w / 2 - pillW / 2)}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="none" stroke="${palette.accent}" stroke-opacity="0.7"/>` +
    `<text x="${Math.round(w / 2)}" y="${pillY + Math.round(pillH * 0.68)}" text-anchor="middle" font-family="${SANS}" font-size="${Math.round(15 * scale)}" font-weight="700" letter-spacing="2" fill="${palette.accent}">COVER</text>` +
    lines
      .map(
        (line, i) =>
          `<text x="${Math.round(w / 2)}" y="${titleY + i * lineHeight}" text-anchor="middle" font-family="${SANS}" font-size="${titleSize}" font-weight="800" fill="#ffffff">${esc(line)}</text>`,
      )
      .join("") +
    hookLines
      .map(
        (line, i) =>
          `<text x="${Math.round(w / 2)}" y="${titleY + lines.length * lineHeight + Math.round(8 * scale) + i * Math.round(27 * scale)}" text-anchor="middle" font-family="${SANS}" font-size="${Math.round(19 * scale)}" fill="#ffffff" opacity="0.8">${esc(line)}</text>`,
      )
      .join("") +
    `<text x="${Math.round(w / 2)}" y="${h - inset - Math.round(26 * scale)}" text-anchor="middle" font-family="${SANS}" font-size="${Math.round(14 * scale)}" font-weight="600" letter-spacing="2" fill="#ffffff" opacity="0.5">${esc(footer)}</text>`
  );
}

const RENDERERS: Record<ThumbnailTemplate, (c: CoverInput) => string> = {
  bold: renderBold,
  minimal: renderMinimal,
  split: renderSplit,
  frame: renderFrame,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;

  const jobId = (q.get("job") || "cover").slice(0, 64);
  const template = isThumbnailTemplate(q.get("template")) ? (q.get("template") as ThumbnailTemplate) : "bold";
  const aspect = q.get("aspect") || "9:16";
  const style = (q.get("style") || "cinematic").slice(0, 60);
  const title = (q.get("title") || "").slice(0, 120);
  const hook = (q.get("hook") || "").slice(0, 160);
  const prompt = (q.get("prompt") || "").slice(0, 400);
  const scenes = Math.max(0, Number(q.get("scenes")) || 0);

  const { w, h } = dims(aspect);
  const input: CoverInput = {
    w,
    h,
    pad: Math.round(w * 0.07),
    scale: w / 540,
    palette: paletteAt(hashStr(jobId), isMonochrome(prompt, style, title, hook)),
    title,
    hook,
    style,
    scenes,
  };

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">` +
    background(input) +
    RENDERERS[template](input) +
    `</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
