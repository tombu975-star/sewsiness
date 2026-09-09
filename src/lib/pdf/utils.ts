import type { PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";

// Same hex values as the CSS custom properties in globals.css — pdf-lib
// only takes 0–1 floats, so these are that same palette pre-converted,
// not a separate "PDF theme" someone could let drift out of sync.
export const COLORS = {
  indigo: rgb(20 / 255, 33 / 255, 61 / 255), // --indigo
  indigo2: rgb(36 / 255, 54 / 255, 95 / 255), // --indigo2
  gold: rgb(251 / 255, 191 / 255, 36 / 255), // --gold
  // --gold-ink — the darker bronze CSS reserves for text that needs to
  // read as "gold" while staying legible; the raw --gold hex is a pale
  // yellow that loses contrast at headline size on white paper.
  goldInk: rgb(122 / 255, 90 / 255, 30 / 255),
  teal: rgb(13 / 255, 148 / 255, 136 / 255), // kente-strip's 2nd band
  ink: rgb(17 / 255, 24 / 255, 39 / 255), // --ink
  inkMuted: rgb(100 / 255, 116 / 255, 139 / 255), // --ink-muted
  surfaceSunken: rgb(238 / 255, 242 / 255, 246 / 255), // --sunken
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function drawCenteredText(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>
) {
  page.drawText(text, { x: centerX - font.widthOfTextAtSize(text, size) / 2, y, size, font, color });
}

function wrapLines(text: string, maxWidth: number, size: number, font: PDFFont): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawWrappedCenteredText(
  page: PDFPage,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  lineHeight = 16
): number {
  const lines = wrapLines(text, maxWidth, size, font);
  lines.forEach((line, i) => drawCenteredText(page, line, centerX, startY - i * lineHeight, size, font, color));
  return startY - lines.length * lineHeight;
}

export function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  lineHeight = 15
): number {
  const lines = wrapLines(text, maxWidth, size, font);
  lines.forEach((line, i) => page.drawText(line, { x, y: startY - i * lineHeight, size, font, color }));
  return startY - lines.length * lineHeight;
}

// Recreates .kente-strip from globals.css (the app's one signature
// repeating motif) as vector rectangles instead of a CSS gradient — same
// 4-band rhythm (gold/purple/indigo/ink), so a printed certificate or
// portfolio cover still visibly belongs to this app rather than looking
// like a generic PDF.
export function drawKenteStrip(page: PDFPage, x: number, y: number, w: number, h: number) {
  const pattern = [
    { color: COLORS.gold, w: 18 },
    { color: COLORS.teal, w: 8 },
    { color: COLORS.indigo, w: 14 },
    { color: COLORS.ink, w: 8 },
  ];
  let cursor = x;
  const end = x + w;
  outer: while (cursor < end) {
    for (const seg of pattern) {
      if (cursor >= end) break outer;
      const segW = Math.min(seg.w, end - cursor);
      page.drawRectangle({ x: cursor, y, width: segW, height: h, color: seg.color });
      cursor += seg.w;
    }
  }
}
