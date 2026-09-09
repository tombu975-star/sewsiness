import { PDFDocument, StandardFonts } from "pdf-lib";
import type { PDFPage, PDFFont } from "pdf-lib";
import QRCode from "qrcode";
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
  programName?: string | null;
  programType?: string | null;
  grade?: string | null;
  finalScore?: number | null;
  verificationCode?: string | null;
  verificationUrl?: string | null;
}

// A4 landscape, in points (1pt = 1/72in) — the shape everyone already
// expects a certificate to be, and wide enough for a name + a full
// sentence of body text to sit on one or two lines without feeling
// cramped the way portrait would.
const PAGE = [842, 595] as const;

// A gold rosette/medallion — the vector equivalent of an embossed foil
// seal. Drawn rather than shipped as an image asset so this module
// stays a pure function with nothing to fetch or keep bundled: same
// reasoning as using the Standard 14 fonts below instead of next/font.
function drawSeal(page: PDFPage, cx: number, cy: number, sans: PDFFont, sansBold: PDFFont) {
  const r = 34;
  // Scalloped edge: a ring of small overlapping circles behind the main
  // disc reads as a rosette outline at this size, without needing a
  // custom bezier path API.
  const petals = 16;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    page.drawCircle({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, size: 9, color: COLORS.gold });
  }
  page.drawCircle({ x: cx, y: cy, size: r, color: COLORS.indigo });
  page.drawCircle({ x: cx, y: cy, size: r - 4, borderColor: COLORS.gold, borderWidth: 1.2 });
  drawCenteredText(page, "CERTIFIED", cx, cy + 9, 7, sansBold, COLORS.gold);
  drawCenteredText(page, "SEWSINESS", cx, cy - 2, 6, sans, COLORS.gold);
  drawCenteredText(page, "T V E T", cx, cy - 12, 6, sans, COLORS.gold);
  // Ribbon tails hanging below the medallion, each cut on the diagonal
  // with a triangular notch so they read as ribbon ends rather than
  // plain rectangles.
  for (const dx of [-14, 3]) {
    page.drawRectangle({ x: cx + dx, y: cy - r - 22, width: 11, height: 26, color: COLORS.indigo });
  }
}

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
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ---------------------------------------------------------------
  // Frame: outer indigo rule, gold hairline, then a large pale-gold
  // watermark disc behind the copy — the "guilloché" cue every
  // internationally-recognised certificate/diploma uses to signal that
  // this is a controlled, non-photocopiable-looking document, without
  // actually needing security printing.
  // ---------------------------------------------------------------
  const margin = 26;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: COLORS.indigo,
    borderWidth: 2.5,
  });
  const inner = margin + 8;
  page.drawRectangle({
    x: inner,
    y: inner,
    width: width - inner * 2,
    height: height - inner * 2,
    borderColor: COLORS.gold,
    borderWidth: 1,
  });
  // Corner flourishes — four short double-ticks, the detail that reads
  // as "engraved" rather than "printed form" at a glance.
  const cornerInset = inner + 14;
  const tick = 20;
  for (const [cx, cy, dx, dy] of [
    [cornerInset, height - cornerInset, 1, -1],
    [width - cornerInset, height - cornerInset, -1, -1],
    [cornerInset, cornerInset, 1, 1],
    [width - cornerInset, cornerInset, -1, 1],
  ] as const) {
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + tick * dx, y: cy }, thickness: 1.5, color: COLORS.gold });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + tick * dy }, thickness: 1.5, color: COLORS.gold });
  }

  page.drawCircle({ x: centerX, y: height / 2 + 10, size: 150, color: COLORS.gold, opacity: 0.06 });

  drawKenteStrip(page, inner, height - inner - 6, width - inner * 2, 6);
  drawKenteStrip(page, inner, inner, width - inner * 2, 6);

  // ---------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------
  drawCenteredText(page, input.organizationName.toUpperCase(), centerX, height - 96, 11, sansBold, COLORS.inkMuted);
  drawCenteredText(page, "CERTIFICATE OF COMPLETION", centerX, height - 130, 30, serifBold, COLORS.indigo);
  page.drawLine({
    start: { x: centerX - 150, y: height - 142 },
    end: { x: centerX + 150, y: height - 142 },
    thickness: 0.75,
    color: COLORS.gold,
  });
  drawCenteredText(
    page,
    input.programName ?? "Fashion & Tailoring Apprenticeship Programme",
    centerX,
    height - 160,
    11.5,
    sans,
    COLORS.inkMuted
  );
  if (input.programType === "tvet") {
    drawCenteredText(page, "TVET COMPETENCY-BASED TRAINING PROGRAMME", centerX, height - 176, 8.5, sansBold, COLORS.goldInk);
  }

  // ---------------------------------------------------------------
  // Body — standard certifying language ("This is to certify that")
  // rather than award-style phrasing, matching how internationally
  // recognised training/completion certificates are conventionally
  // worded.
  // ---------------------------------------------------------------
  drawCenteredText(page, "This is to certify that", centerX, height - 210, 12, serifItalic, COLORS.inkMuted);
  drawCenteredText(page, input.apprenticeName, centerX, height - 252, 30, serifBold, COLORS.goldInk);
  page.drawLine({
    start: { x: centerX - 200, y: height - 262 },
    end: { x: centerX + 200, y: height - 262 },
    thickness: 0.75,
    color: COLORS.inkMuted,
  });

  const specialisation = input.specialisation ?? "Tailoring & Dressmaking";
  const levelClause = input.trainingLevel ? ` at the ${input.trainingLevel} level` : "";
  const body = `has successfully completed ${
    input.programName ? `the ${input.programName} programme` : `a structured apprenticeship in ${specialisation}${levelClause}`
  } at ${input.organizationName}, and has met the required standard of competence.`;
  const afterBody = drawWrappedCenteredText(page, body, centerX, height - 288, 480, 12, serif, COLORS.ink, 17);

  const startStr = input.startDate ? formatDate(input.startDate) : null;
  const period = startStr ? `${startStr} \u2014 ${formatDate(input.completedAt)}` : `Completed ${formatDate(input.completedAt)}`;
  drawCenteredText(page, period, centerX, Math.min(afterBody - 12, height - 336), 11, sansBold, COLORS.ink);

  if (input.grade || typeof input.finalScore === "number") {
    const result = `Result: ${input.grade ?? "Completed"}${
      typeof input.finalScore === "number" ? `  \u00B7  Final score ${input.finalScore.toFixed(1)}%` : ""
    }`;
    drawCenteredText(page, result, centerX, height - 366, 11.5, sansBold, COLORS.indigo);
  }

  // ---------------------------------------------------------------
  // Signature block — three columns: Trainer, seal, Owner/Issuing
  // authority. The seal sits between the two signatures the way a wax
  // or embossed stamp conventionally straddles a co-signed document.
  // ---------------------------------------------------------------
  const sigY = 120;
  const sigWidth = 175;
  const leftX = centerX - 260;
  const rightX = centerX + 85;

  page.drawLine({ start: { x: leftX, y: sigY }, end: { x: leftX + sigWidth, y: sigY }, thickness: 1, color: COLORS.inkMuted });
  drawCenteredText(page, input.trainerName ?? "\u2014", leftX + sigWidth / 2, sigY + 6, 11, serifBold, COLORS.ink);
  drawCenteredText(page, "Trainer", leftX + sigWidth / 2, sigY - 12, 8, sans, COLORS.inkMuted);

  drawSeal(page, centerX, sigY + 34, sans, sansBold);

  page.drawLine({ start: { x: rightX, y: sigY }, end: { x: rightX + sigWidth, y: sigY }, thickness: 1, color: COLORS.inkMuted });
  drawCenteredText(page, input.organizationName, rightX + sigWidth / 2, sigY + 6, 11, serifBold, COLORS.ink);
  drawCenteredText(page, "Owner / Issuing Authority", rightX + sigWidth / 2, sigY - 12, 8, sans, COLORS.inkMuted);

  // ---------------------------------------------------------------
  // Footer — certificate number bottom-left (the way a serial number
  // conventionally reads), scannable verification QR bottom-right so a
  // physical printout can still be checked without typing a URL, plain
  // text fallback if there's no verification code to encode. Kept well
  // clear of the kente strip (top edge at inner + 6) so nothing here
  // ever touches or overlaps the border band.
  // ---------------------------------------------------------------
  const footerY = inner + 44;
  page.drawText(`No. ${input.certificateNumber ?? "\u2014"}`, {
    x: inner + 24,
    y: footerY,
    size: 9,
    font: sansBold,
    color: COLORS.ink,
  });
  page.drawText(`Issued ${formatDate(input.completedAt)}`, {
    x: inner + 24,
    y: footerY - 13,
    size: 7.5,
    font: sans,
    color: COLORS.inkMuted,
  });

  if (input.verificationUrl) {
    const qrSize = 48;
    const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
      margin: 0,
      color: { dark: "#111827", light: "#00000000" },
    });
    const qrPng = await doc.embedPng(qrDataUrl);
    const qrX = width - inner - 24 - qrSize;
    const qrY = inner + 20;
    page.drawImage(qrPng, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    drawCenteredText(page, "Scan to verify", qrX + qrSize / 2, qrY + qrSize + 6, 6.5, sans, COLORS.inkMuted);
  } else {
    drawCenteredText(page, "Sewsiness Fashion Business OS", width - inner - 140, footerY - 6, 8, sans, COLORS.inkMuted);
  }

  return doc.save();
}