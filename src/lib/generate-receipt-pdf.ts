"use client";

import { jsPDF } from "jspdf";

interface ReceiptData {
  paymentId: string;
  studentName: string;
  membershipNumber?: string;
  amount: string;
  paymentType: "monthly" | "bus" | "uniform";
  paymentMethod: "cash" | "bank_transfer";
  payerName?: string | null;
  paymentDate: string;
  notes?: string | null;
  monthsCovered?: string[];
}

const paymentTypeAr: Record<string, string> = {
  monthly: "\u0627\u0634\u062a\u0631\u0627\u0643 \u0634\u0647\u0631\u064a",
  bus: "\u0631\u0633\u0648\u0645 \u0627\u0644\u0628\u0627\u0635",
  uniform: "\u0627\u0644\u0632\u064a \u0627\u0644\u0631\u0633\u0645\u064a",
};

const paymentMethodAr: Record<string, string> = {
  cash: "\u0646\u0642\u062f\u064a",
  bank_transfer: "\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a",
};

const arabicMonths: Record<string, string> = {
  "01": "\u064a\u0646\u0627\u064a\u0631",
  "02": "\u0641\u0628\u0631\u0627\u064a\u0631",
  "03": "\u0645\u0627\u0631\u0633",
  "04": "\u0623\u0628\u0631\u064a\u0644",
  "05": "\u0645\u0627\u064a\u0648",
  "06": "\u064a\u0648\u0646\u064a\u0648",
  "07": "\u064a\u0648\u0644\u064a\u0648",
  "08": "\u0623\u063a\u0633\u0637\u0633",
  "09": "\u0633\u0628\u062a\u0645\u0628\u0631",
  "10": "\u0623\u0643\u062a\u0648\u0628\u0631",
  "11": "\u0646\u0648\u0641\u0645\u0628\u0631",
  "12": "\u062f\u064a\u0633\u0645\u0628\u0631",
};

// Brand color: #1a3a5c → RGB(26, 58, 92)
const BRAND = { r: 26, g: 58, b: 92 };
const BRAND_LIGHT = { r: 232, g: 240, b: 248 }; // light tint
const GOLD = { r: 218, g: 165, b: 32 };

/**
 * Load Arabic fonts (Amiri) and register with jsPDF.
 * Fonts are fetched from /fonts/ at runtime and registered as VFS entries.
 */
async function loadArabicFonts(doc: jsPDF) {
  const loadFont = async (filename: string, fontName: string, style: string) => {
    const resp = await fetch(`/fonts/${filename}`);
    const buf = await resp.arrayBuffer();
    const binary = new Uint8Array(buf);
    let binaryStr = "";
    for (let i = 0; i < binary.length; i++) {
      binaryStr += String.fromCharCode(binary[i]);
    }
    const base64 = btoa(binaryStr);
    doc.addFileToVFS(filename, base64);
    doc.addFont(filename, fontName, style);
  };

  await loadFont("Amiri-Regular.ttf", "Amiri", "normal");
  await loadFont("Amiri-Bold.ttf", "Amiri", "bold");
}

/**
 * Load logo image as base64 data URL for embedding in PDF.
 */
async function loadLogo(): Promise<string | null> {
  try {
    const resp = await fetch("/logo.jpeg");
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    const binary = new Uint8Array(buf);
    let binaryStr = "";
    for (let i = 0; i < binary.length; i++) {
      binaryStr += String.fromCharCode(binary[i]);
    }
    return "data:image/jpeg;base64," + btoa(binaryStr);
  } catch {
    return null;
  }
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${arabicMonths[month] || month} ${year}`;
}

/**
 * Helper: draw right-aligned Arabic text.
 * jsPDF doesn't do RTL reshaping, so we reverse the visual order for display.
 * For mixed content we keep it simple — Arabic names render correctly with Amiri font.
 */
function arText(doc: jsPDF, text: string, x: number, yPos: number, opts?: { align?: "right" | "center" | "left" }) {
  doc.text(text, x, yPos, opts);
}

export async function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Load fonts and logo in parallel
  const [, logoData] = await Promise.all([
    loadArabicFonts(doc),
    loadLogo(),
  ]);

  // ===== TOP ACCENT STRIPE =====
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(0, 0, pageWidth, 3, "F");

  // ===== HEADER =====
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 3, pageWidth, 54, "F");

  // Logo
  if (logoData) {
    try {
      doc.addImage(logoData, "JPEG", pageWidth / 2 - 12, 7, 24, 24);
    } catch {
      // Skip logo if it fails
    }
  }

  // Academy name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ESPANYOLA ACADEMY", pageWidth / 2, 38, { align: "center" });

  // Arabic subtitle
  doc.setFont("Amiri", "bold");
  doc.setFontSize(14);
  doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  arText(doc, "\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0625\u0633\u0628\u0627\u0646\u064a\u0648\u0644\u0627 \u0644\u0643\u0631\u0629 \u0627\u0644\u0642\u062f\u0645", pageWidth / 2, 46, { align: "center" });

  // Receipt title
  doc.setFont("Amiri", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  arText(doc, "\u0625\u064a\u0635\u0627\u0644 \u062f\u0641\u0639", pageWidth / 2, 54, { align: "center" });

  y = 62;

  // ===== RECEIPT NUMBER BAR =====
  doc.setFillColor(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");

  const receiptNo = data.paymentId.substring(0, 8).toUpperCase();

  doc.setFont("Amiri", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  arText(doc, `\u0631\u0642\u0645 \u0627\u0644\u0625\u064a\u0635\u0627\u0644: #${receiptNo}`, margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${data.paymentDate}`, pageWidth - margin - 6, y + 7, { align: "right" });

  y += 16;

  // ===== INFO CARDS ROW =====
  const cardW = (contentWidth - 6) / 3;

  // Date card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, cardW, 18, 2, 2, "F");
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(margin, y, cardW, 3, "F");
  doc.setFont("Amiri", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  arText(doc, "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", margin + cardW / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(data.paymentDate, margin + cardW / 2, y + 14, { align: "center" });

  // Method card
  const card2X = margin + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card2X, y, cardW, 18, 2, 2, "F");
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(card2X, y, cardW, 3, "F");
  doc.setFont("Amiri", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  arText(doc, "\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639", card2X + cardW / 2, y + 8, { align: "center" });
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  arText(doc, paymentMethodAr[data.paymentMethod] || data.paymentMethod, card2X + cardW / 2, y + 14, { align: "center" });

  // Type card
  const card3X = margin + (cardW + 3) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(card3X, y, cardW, 18, 2, 2, "F");
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(card3X, y, cardW, 3, "F");
  doc.setFont("Amiri", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  arText(doc, "\u0646\u0648\u0639 \u0627\u0644\u062f\u0641\u0639", card3X + cardW / 2, y + 8, { align: "center" });
  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  arText(doc, paymentTypeAr[data.paymentType] || data.paymentType, card3X + cardW / 2, y + 14, { align: "center" });

  y += 24;

  // ===== STUDENT INFORMATION SECTION =====
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  arText(doc, "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0644\u0627\u0639\u0628", pageWidth / 2, y + 6, { align: "center" });

  y += 12;

  // Student info box
  const infoLines = 1 + (data.membershipNumber ? 1 : 0) + (data.payerName ? 1 : 0);
  const infoBoxH = 8 + infoLines * 9;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, infoBoxH, 2, 2, "F");

  // Left accent bar
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(pageWidth - margin - 3, y + 2, 2, infoBoxH - 4, "F");

  let infoY = y + 8;
  const labelRightX = pageWidth - margin - 8;
  const valueRightX = pageWidth - margin - 42;

  // Name
  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  arText(doc, "\u0627\u0633\u0645 \u0627\u0644\u0644\u0627\u0639\u0628:", labelRightX, infoY, { align: "right" });
  doc.setFont("Amiri", "normal");
  doc.setTextColor(30, 30, 30);
  arText(doc, data.studentName, valueRightX, infoY, { align: "right" });
  infoY += 9;

  // Membership
  if (data.membershipNumber) {
    doc.setFont("Amiri", "bold");
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    arText(doc, "\u0631\u0642\u0645 \u0627\u0644\u0639\u0636\u0648\u064a\u0629:", labelRightX, infoY, { align: "right" });
    doc.setFont("Amiri", "normal");
    doc.setTextColor(30, 30, 30);
    arText(doc, data.membershipNumber, valueRightX, infoY, { align: "right" });
    infoY += 9;
  }

  // Payer
  if (data.payerName) {
    doc.setFont("Amiri", "bold");
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    arText(doc, "\u0627\u0644\u062f\u0627\u0641\u0639:", labelRightX, infoY, { align: "right" });
    doc.setFont("Amiri", "normal");
    doc.setTextColor(30, 30, 30);
    arText(doc, data.payerName, valueRightX, infoY, { align: "right" });
    infoY += 9;
  }

  y += infoBoxH + 6;

  // ===== PAYMENT DETAILS SECTION =====
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("Amiri", "bold");
  doc.setFontSize(11);
  arText(doc, "\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062f\u0641\u0639", pageWidth / 2, y + 6, { align: "center" });

  y += 12;

  // Table header
  doc.setFillColor(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b);
  doc.roundedRect(margin, y, contentWidth, 9, 1, 1, "F");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  arText(doc, "\u0627\u0644\u0645\u0628\u0644\u063a (TL)", margin + 6, y + 6);
  arText(doc, "\u0627\u0644\u0628\u064a\u0627\u0646", pageWidth - margin - 6, y + 6, { align: "right" });

  y += 12;

  // Payment row
  doc.setFont("Amiri", "normal");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);

  const typeDesc = paymentTypeAr[data.paymentType] || data.paymentType;

  if (data.monthsCovered && data.monthsCovered.length > 0) {
    const monthLabels = data.monthsCovered.map(formatMonthLabel).join(" \u060C ");
    const fullDesc = `${typeDesc} (${data.monthsCovered.length} \u0634\u0647\u0631)`;
    arText(doc, fullDesc, pageWidth - margin - 6, y, { align: "right" });
    doc.setFont("Amiri", "bold");
    doc.text(`${data.amount} TL`, margin + 6, y);
    y += 7;

    // Months detail
    doc.setFont("Amiri", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    arText(doc, `\u0627\u0644\u0623\u0634\u0647\u0631: ${monthLabels}`, pageWidth - margin - 10, y, { align: "right" });
    y += 7;
  } else {
    arText(doc, typeDesc, pageWidth - margin - 6, y, { align: "right" });
    doc.setFont("Amiri", "bold");
    doc.text(`${data.amount} TL`, margin + 6, y);
    y += 7;
  }

  // Separator
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 6;

  // ===== TOTAL BOX =====
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(margin, y, contentWidth, 16, 3, 3, "F");

  // Gold left accent
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(margin + 1, y + 3, 3, 10, "F");

  doc.setFont("Amiri", "bold");
  doc.setFontSize(13);
  doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  arText(doc, "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a", pageWidth - margin - 8, y + 11, { align: "right" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.amount} TL`, margin + 10, y + 12);

  y += 24;

  // ===== NOTES =====
  if (data.notes) {
    doc.setFillColor(255, 251, 235);
    const splitNotes = doc.splitTextToSize(data.notes, contentWidth - 16);
    const notesH = 12 + splitNotes.length * 5;
    doc.roundedRect(margin, y, contentWidth, notesH, 2, 2, "F");

    // Accent line
    doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
    doc.rect(pageWidth - margin - 3, y + 2, 2, notesH - 4, "F");

    doc.setFont("Amiri", "bold");
    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14);
    arText(doc, "\u0645\u0644\u0627\u062d\u0638\u0627\u062a:", pageWidth - margin - 8, y + 8, { align: "right" });
    doc.setFont("Amiri", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 53, 15);
    arText(doc, splitNotes.join("\n"), pageWidth - margin - 8, y + 14, { align: "right" });
    y += notesH + 6;
  }

  // ===== STAMP & SIGNATURE =====
  y += 4;
  const boxW = (contentWidth - 10) / 2;
  const boxH = 28;

  // Stamp box
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([3, 2], 0);
  doc.roundedRect(margin, y, boxW, boxH, 3, 3, "S");
  doc.setLineDashPattern([], 0);

  doc.setFont("Amiri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  arText(doc, "\u0627\u0644\u062e\u062a\u0645", margin + boxW / 2, y + boxH / 2 + 2, { align: "center" });

  // Signature box  
  const sigX = margin + boxW + 10;
  doc.setLineDashPattern([3, 2], 0);
  doc.roundedRect(sigX, y, boxW, boxH, 3, 3, "S");
  doc.setLineDashPattern([], 0);

  arText(doc, "\u0627\u0644\u062a\u0648\u0642\u064a\u0639", sigX + boxW / 2, y + boxH / 2 + 2, { align: "center" });

  // ===== FOOTER =====
  const footerY = pageHeight - 22;

  doc.setFillColor(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b);
  doc.rect(0, footerY - 2, pageWidth, 24, "F");

  // Top line  
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(0.6);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text("ESPANYOLA FOOTBALL ACADEMY", pageWidth / 2, footerY + 4, { align: "center" });

  doc.setFont("Amiri", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  arText(doc, "\u0647\u0630\u0627 \u0625\u064a\u0635\u0627\u0644 \u0635\u0627\u062f\u0631 \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a", pageWidth / 2, footerY + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Receipt ID: ${data.paymentId}`, pageWidth / 2, footerY + 15, { align: "center" });

  // Bottom gold stripe
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

  // Download
  doc.save(`receipt-${receiptNo}-${data.paymentDate}.pdf`);
}
