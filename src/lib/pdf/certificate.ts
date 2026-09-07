import { PDFDocument, StandardFonts } from "pdf-lib";
import { COLORS, drawCenteredText, drawWrappedCenteredText, drawKenteStrip, formatDate } from "./utils";

export interface CertificateInput {
  apprenticeName: string;
  organizationName: string;
  specialisation: string | null;
  trainingLevel: string | null;
  trainerName: string | null;
  startDate: string | null;
  completedAt: string;
  certificateNumber: string | null;
}

// A4 landscape, in points (1pt = 1/72in) — the shape everyone already
// expects a certificate to be, and wide enough for a name + a full
// sentence of body text to sit on one or two lines without feeling
// cramped the way portrait would.
const PAGE = [842, 595] as const;

export async function buildCertificatePdf(input: CertificateInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([...PAGE]);
  const { width, height } = page.getSize();
  const centerX = width / 2;

  // Standard 14 PDF fonts — no font files to fetch/bundle/keep in sync,
  // which matters here specifically because this route runs at request
  // time in a serverless function, not at build time like next/font.
  // Times Roman for the ceremonial parts (a serif reads as "certificate"
  // the way a sans-serif doesn't), Helvetica for supporting text.
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Double border frame — indigo outer, gold hairline inner.
  const margin = 28;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: COLORS.indigo,
    borderWidth: 2,
  });
  const inner = margin + 10;
  page.drawRectangle({
    x: inner,
    y: inner,
    width: width - inner * 2,
    height: height - inner * 2,
    borderColor: COLORS.gold,
    borderWidth: 1,
  });

  drawKenteStrip(page, inner, height - inner - 6, width - inner * 2, 6);
  drawKenteStrip(page, inner, inner, width - inner * 2, 6);

  drawCenteredText(page, "CERTIFICATE OF COMPLETION", centerX, height - 148, 28, serifBold, COLORS.indigo);
  drawCenteredText(page, "Fashion & Tailoring Apprenticeship", centerX, height - 170, 12, sans, COLORS.inkMuted);

  drawCenteredText(page, "This certificate is proudly presented to", centerX, height - 218, 11, serif, COLORS.inkMuted);
  drawCenteredText(page, input.apprenticeName, centerX, height - 262, 32, serifBold, COLORS.goldInk);

  const specialisation = input.specialisation ?? "Tailoring & Dressmaking";
  const levelClause = input.trainingLevel ? ` at the ${input.trainingLevel} level` : "";
  const body = `has successfully completed a structured apprenticeship in ${specialisation}${levelClause} at ${input.organizationName}.`;
  const afterBody = drawWrappedCenteredText(page, body, centerX, height - 300, 460, 12.5, serif, COLORS.ink, 18);

  const startStr = input.startDate ? formatDate(input.startDate) : null;
  const period = startStr ? `${startStr}  –  ${formatDate(input.completedAt)}` : `Completed ${formatDate(input.completedAt)}`;
  drawCenteredText(page, period, centerX, Math.min(afterBody - 14, height - 348), 11, sansBold, COLORS.ink);

  // Signature lines
  const sigY = 118;
  const sigWidth = 190;
  const leftX = centerX - 220;
  const rightX = centerX + 30;

  page.drawLine({ start: { x: leftX, y: sigY }, end: { x: leftX + sigWidth, y: sigY }, thickness: 1, color: COLORS.inkMuted });
  page.drawText(input.trainerName ?? "—", { x: leftX, y: sigY - 16, size: 10, font: sansBold, color: COLORS.ink });
  page.drawText("Trainer", { x: leftX, y: sigY - 30, size: 8, font: sans, color: COLORS.inkMuted });

  page.drawLine({ start: { x: rightX, y: sigY }, end: { x: rightX + sigWidth, y: sigY }, thickness: 1, color: COLORS.inkMuted });
  page.drawText(input.organizationName, { x: rightX, y: sigY - 16, size: 10, font: sansBold, color: COLORS.ink });
  page.drawText("Owner / Madam", { x: rightX, y: sigY - 30, size: 8, font: sans, color: COLORS.inkMuted });

  const footer = `Certificate No. ${input.certificateNumber ?? "—"}   ·   Issued ${formatDate(input.completedAt)}   ·   Sewsiness Fashion Business OS`;
  drawCenteredText(page, footer, centerX, inner + 18, 8, sans, COLORS.inkMuted);

  return doc.save();
}
