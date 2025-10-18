// src/pdf/theme.ts
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
type PDFDocumentType = InstanceType<typeof PDFDocument>;

export const palette = {
  primary: '#0ea5e9',   // sky-500
  primaryDark: '#0284c7',
  ink: '#111827',       // gray-900
  text: '#374151',      // gray-700
  subtext: '#6b7280',   // gray-500
  line: '#e5e7eb',      // gray-200
  zebra: '#f9fafb',     // gray-50
  accent: '#22c55e',    // green-500
  warn: '#f59e0b',      // amber-500
};

export const page = { margin: 42 };

const fontDir = path.join(process.cwd(), 'assets', 'fonts');
// Optional Inter fonts: Inter-Regular.ttf / Inter-Medium.ttf / Inter-Bold.ttf
const fonts = {
  regular: path.join(fontDir, 'Inter-Regular.ttf'),
  medium:  path.join(fontDir, 'Inter-Medium.ttf'),
  bold:    path.join(fontDir, 'Inter-Bold.ttf'),
};

export function registerFonts(doc: PDFDocumentType) {
  const hasRegular = fs.existsSync(fonts.regular);
  const hasMedium  = fs.existsSync(fonts.medium);
  const hasBold    = fs.existsSync(fonts.bold);

  try { if (hasRegular) doc.registerFont('App', fonts.regular); } catch {}
  try { if (hasMedium)  doc.registerFont('App-Medium', fonts.medium); } catch {}
  try { if (hasBold)    doc.registerFont('App-Bold', fonts.bold); } catch {}

  // Set an initial safe font so pdfkit can render even without custom fonts
  doc.font('Helvetica');
}

// helper that never throws if a custom font is missing
export function useFont(doc: PDFDocumentType, family: 'App'|'App-Medium'|'App-Bold'|'Helvetica'|'Helvetica-Bold', size?: number) {
  try {
    doc.font(family, size);
  } catch {
    const fallback = family.includes('Bold') ? 'Helvetica-Bold' : 'Helvetica';
    doc.font(fallback as any, size);
  }
}

export function inr(n: number) {
  return '₹ ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
