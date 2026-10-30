import { NextResponse } from "next/server";
import { isMonochrome, paletteAt } from "@/app/lib/visual-palette";

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;

  const sceneIndex = Math.max(1, Number(q.get("scene")) || 1);
  const total = Math.max(sceneIndex, Number(q.get("total")) || sceneIndex);
  const aspect = q.get("aspect") || "9:16";
  const style = (q.get("style") || "cinematic").slice(0, 60);
  const prompt = (q.get("prompt") || "").slice(0, 500);
  const visual = (q.get("visual") || "Storyboard frame").slice(0, 280);
  const onScreenText = (q.get("text") || "").slice(0, 120);
  const broll = (q.get("broll") || "b-roll").slice(0, 40);
  const timecode = (q.get("timecode") || "").slice(0, 24);
  const imagePrompt = (q.get("imagePrompt") || "").slice(0, 300);
  /* `bare=1` dipakai saat ekspor: caption digambar ulang di canvas. */
  const bare = q.get("bare") === "1";

  const { w, h } = dims(aspect);
  const mono = isMonochrome(prompt, style, visual, onScreenText, broll, imagePrompt);
  const palette = paletteAt(sceneIndex, mono);
  const pad = Math.round(w * 0.07);
  const scale = w / 540; // 1 untuk 9:16, lebih besar untuk landscape
  const num = String(sceneIndex).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");

  const visualLines = wrap(visual, aspect === "16:9" ? 52 : 30, 4);
  const captionLines = onScreenText ? wrap(`“${onScreenText}”`, aspect === "16:9" ? 46 : 26, 2) : [];

  const visualSize = Math.round(21 * scale);
  const lineHeight = Math.round(30 * scale);
  const visualStartY = Math.round(h * 0.40);
  const captionY = h - pad - captionLines.length * Math.round(30 * scale);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">` +
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
    `<rect width="${w}" height="${h}" fill="url(#grid)"/>` +
    // rule-of-thirds guides
    `<g stroke="#ffffff" stroke-opacity="0.10" stroke-dasharray="6 6">` +
    `<line x1="${Math.round(w / 3)}" y1="0" x2="${Math.round(w / 3)}" y2="${h}"/>` +
    `<line x1="${Math.round((2 * w) / 3)}" y1="0" x2="${Math.round((2 * w) / 3)}" y2="${h}"/>` +
    `<line x1="0" y1="${Math.round(h / 3)}" x2="${w}" y2="${Math.round(h / 3)}"/>` +
    `<line x1="0" y1="${Math.round((2 * h) / 3)}" x2="${w}" y2="${Math.round((2 * h) / 3)}"/>` +
    `</g>` +
    // big scene number watermark
    `<text x="${w - pad}" y="${Math.round(h * 0.30)}" text-anchor="end" font-family="system-ui,sans-serif" font-size="${Math.round(150 * scale)}" font-weight="900" fill="#ffffff" opacity="0.10">${num}</text>` +
    // header: scene badge + timecode
    `<text x="${pad}" y="${pad + Math.round(18 * scale)}" font-family="system-ui,sans-serif" font-size="${Math.round(17 * scale)}" font-weight="700" letter-spacing="3" fill="#ffffff" opacity="0.55">SCENE ${num} / ${totalStr}</text>` +
    (timecode
      ? `<text x="${w - pad}" y="${pad + Math.round(18 * scale)}" text-anchor="end" font-family="ui-monospace,monospace" font-size="${Math.round(16 * scale)}" fill="#ffffff" opacity="0.45">${esc(timecode)}</text>`
      : ``) +
    // b-roll pill
    `<g>` +
    `<rect x="${pad}" y="${pad + Math.round(34 * scale)}" width="${Math.min(w - pad * 2, broll.length * Math.round(10.5 * scale) + Math.round(28 * scale))}" height="${Math.round(34 * scale)}" rx="${Math.round(17 * scale)}" fill="#000000" opacity="0.45"/>` +
    `<rect x="${pad}" y="${pad + Math.round(34 * scale)}" width="${Math.min(w - pad * 2, broll.length * Math.round(10.5 * scale) + Math.round(28 * scale))}" height="${Math.round(34 * scale)}" rx="${Math.round(17 * scale)}" fill="none" stroke="${palette.accent}" stroke-opacity="0.6"/>` +
    `<text x="${pad + Math.round(14 * scale)}" y="${pad + Math.round(57 * scale)}" font-family="system-ui,sans-serif" font-size="${Math.round(15 * scale)}" font-weight="600" fill="${palette.accent}">${esc(broll.toUpperCase())}</text>` +
    `</g>` +
    // visual description
    visualLines
      .map(
        (line, i) =>
          `<text x="${pad}" y="${visualStartY + i * lineHeight}" font-family="system-ui,sans-serif" font-size="${visualSize}" fill="#ffffff" opacity="0.88">${esc(line)}</text>`,
      )
      .join("") +
    // caption bar
    (!bare && captionLines.length > 0
      ? `<g>` +
        `<rect x="${pad}" y="${captionY - Math.round(22 * scale)}" width="${w - pad * 2}" height="${captionLines.length * Math.round(30 * scale) + Math.round(30 * scale)}" rx="${Math.round(10 * scale)}" fill="#000000" opacity="0.55"/>` +
        captionLines
          .map(
            (line, i) =>
              `<text x="${pad + Math.round(14 * scale)}" y="${captionY + i * Math.round(30 * scale)}" font-family="system-ui,sans-serif" font-size="${Math.round(19 * scale)}" font-weight="600" fill="${palette.accent}">${esc(line)}</text>`,
          )
          .join("") +
        `</g>`
      : ``) +
    `</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
