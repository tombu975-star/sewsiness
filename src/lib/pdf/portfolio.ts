import { PDFDocument, StandardFonts } from "pdf-lib";
import { COLORS, drawCenteredText, drawWrappedText, drawKenteStrip, formatDate } from "./utils";

export interface PortfolioItemInput {
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PortfolioInput {
  apprenticeName: string;
  organizationName: string;
  specialisation: string | null;
  trainingLevel: string | null;
  items: PortfolioItemInput[];
}

// Portrait A4, in points — right for a document meant to be read
// top-to-bottom one piece at a time, unlike the certificate.
const PAGE = [595, 842] as const;

export async function buildPortfolioPdf(input: PortfolioInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ---- Cover page ----
  const cover = doc.addPage([...PAGE]);
  const { width: cw, height: ch } = cover.getSize();
  drawKenteStrip(cover, 0, ch - 10, cw, 10);
  drawKenteStrip(cover, 0, 0, cw, 10);

  drawCenteredText(cover, "PORTFOLIO", cw / 2, ch - 170, 34, serifBold, COLORS.indigo);
  drawCenteredText(cover, input.apprenticeName, cw / 2, ch - 210, 22, serifBold, COLORS.goldInk);
  const subline = [input.specialisation, input.trainingLevel ? `${input.trainingLevel} level` : null, input.organizationName]
    .filter(Boolean)
    .join("   ·   ");
  if (subline) drawCenteredText(cover, subline, cw / 2, ch - 234, 11.5, sans, COLORS.inkMuted);
  const count = `${input.items.length} piece${input.items.length === 1 ? "" : "s"}`;
  drawCenteredText(cover, count, cw / 2, ch - 254, 10.5, sans, COLORS.inkMuted);
  drawCenteredText(cover, `Exported ${formatDate(new Date().toISOString())}`, cw / 2, 60, 9, sans, COLORS.inkMuted);

  if (input.items.length === 0) {
    drawCenteredText(cover, "No pieces added yet.", cw / 2, ch / 2, 12, sans, COLORS.inkMuted);
  }

  // ---- One page per piece ----
  for (const item of input.items) {
    const page = doc.addPage([...PAGE]);
    const { width, height } = page.getSize();
    const margin = 48;
    let imageDrawn = false;

    if (item.image_url) {
      try {
        // portfolio-images is a public bucket (040_portfolio_images.sql),
        // so this is a plain unauthenticated fetch — no signed URL or
        // service-role key needed to read it back.
        const res = await fetch(item.image_url);
        if (res.ok) {
          const bytes = new Uint8Array(await res.arrayBuffer());
          const contentType = res.headers.get("content-type") ?? "";
          const isPng = contentType.includes("png") || item.image_url.toLowerCase().endsWith(".png");
          const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const maxW = width - margin * 2;
          const maxH = height - 280;
          const scale = Math.min(maxW / image.width, maxH / image.height, 1);
          const w = image.width * scale;
          const h = image.height * scale;
          page.drawImage(image, { x: (width - w) / 2, y: height - 110 - h, width: w, height: h });
          imageDrawn = true;
        }
      } catch {
        // A single broken/unreachable image shouldn't fail the whole
        // export — that page just falls back to the placeholder block
        // below and every other piece still exports fine.
      }
    }

    if (!imageDrawn) {
      const boxH = 360;
      page.drawRectangle({ x: margin, y: height - 110 - boxH, width: width - margin * 2, height: boxH, color: COLORS.surfaceSunken });
      drawCenteredText(page, "No image", width / 2, height - 110 - boxH / 2, 11, sans, COLORS.inkMuted);
    }

    const textTop = height - 500;
    page.drawText(item.title, { x: margin, y: textTop, size: 16, font: sansBold, color: COLORS.ink });
    page.drawText(formatDate(item.created_at), { x: margin, y: textTop - 18, size: 9.5, font: sans, color: COLORS.inkMuted });
    if (item.description) {
      drawWrappedText(page, item.description, margin, textTop - 40, width - margin * 2, 11, sans, COLORS.inkMuted, 15);
    }
  }

  // Footer with page numbers, skipping the cover.
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    if (i === 0) return;
    const { width } = p.getSize();
    const footer = `${input.apprenticeName}   ·   ${input.organizationName}   ·   ${i} / ${pages.length - 1}`;
    drawCenteredText(p, footer, width / 2, 28, 8, sans, COLORS.inkMuted);
  });

  return doc.save();
}
