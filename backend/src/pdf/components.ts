// src/pdf/components.ts
import PDFDocument from 'pdfkit';
type PDFDocumentType = InstanceType<typeof PDFDocument>;

import { palette, page, registerFonts, useFont } from './theme';

type Col = {
  header: string;
  width: number; // desired width (auto-scaled to fit)
  align?: 'left' | 'right' | 'center';
  key?: string;
};

export function initDoc(doc: PDFDocumentType) {
  registerFonts(doc);
  doc.info.Producer = 'Glass Store';
  doc.info.Creator = 'Glass Store';
  doc.info.Author = 'Glass Store';

  (doc as any).__pageNo = 1;
  doc.on('pageAdded', () => {
    (doc as any).__pageNo = ((doc as any).__pageNo ?? 1) + 1;
    drawFooter(doc, (doc as any).__pageNo);
  });
}

export function drawHeader(
  doc: PDFDocumentType,
  opts: {
    title: string;
    subtitle?: string;
    rightMeta?: string;
    org: {
      name: string;
      gstNumber?: string;
      addressLine1?: string;
      phone?: string;
      email?: string;
    };
    logoPath?: string | null;
  }
) {
  const { title, subtitle, rightMeta, org, logoPath } = opts;
  const { margin } = page;

  // top bar
  doc.rect(0, 0, doc.page.width, 24).fill(palette.primary);

  // org line
  doc.fillColor('white');
  useFont(doc, 'App-Bold', 14);
  doc.text(org.name || 'Organization', margin, 6, { continued: true });
  useFont(doc, 'App', 10);
  doc.fillColor('white').text(org.gstNumber ? `  •  GSTIN: ${org.gstNumber}` : '');

  // logo (optional)
  if (logoPath) {
    try {
      doc.image(logoPath, doc.page.width - margin - 80, 6, { width: 64, height: 12, fit: [64, 12] });
    } catch { /* ignore */ }
  }

  // title + sub
  doc.fillColor(palette.ink);
  useFont(doc, 'App-Bold', 20);
  doc.text(title, margin, 44);
  if (typeof subtitle === 'string') {
    useFont(doc, 'App', 11);
    doc.fillColor(palette.subtext).text(subtitle);
  }

  // right meta badge
  if (typeof rightMeta === 'string') {
    const w = 180;
    doc.roundedRect(doc.page.width - margin - w, 40, w, 36, 6).fillAndStroke('#ffffff', palette.line);
    useFont(doc, 'App', 10);
    doc
      .fillColor(palette.text)
      .text(rightMeta, doc.page.width - margin - w + 10, 51, { width: w - 20, align: 'right' });
  }

  // org meta row
  doc.moveDown(0.4).fillColor(palette.subtext);
  useFont(doc, 'App', 9);
  const meta = [org.addressLine1, org.phone, org.email].filter(Boolean).join('  •  ');
  if (meta) doc.text(meta, margin, 86);

  // divider
  doc
    .moveTo(margin, 102)
    .lineTo(doc.page.width - margin, 102)
    .strokeColor(palette.line)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1);
}

export function drawFooter(doc: PDFDocumentType, pageNo?: number) {
  const { margin } = page;

  // capture current cursor so footer doesn't affect flow
  const prevX = doc.x;
  const prevY = doc.y;

  // draw footer safely INSIDE the printable area
  const lineY = doc.page.height - margin - 24;     // line above the footer
  const textY = lineY + 6;                          // footer text row

  // horizontal divider
  doc
    .moveTo(margin, lineY)
    .lineTo(doc.page.width - margin, lineY)
    .strokeColor(palette.line)
    .lineWidth(1)
    .stroke();

  // right-aligned page number within the content width
  const contentWidth = doc.page.width - margin * 2;
  const current = pageNo ?? (doc as any).__pageNo ?? 1;

  useFont(doc, 'App', 9);
  doc.fillColor(palette.subtext).text(
    `Page ${current}`,
    margin,
    textY,
    { width: contentWidth, align: 'right' }
  );

  // restore cursor so we don’t trigger accidental page breaks
  doc.x = prevX;
  doc.y = prevY;
}

export function pill(doc: PDFDocumentType, text: string, color = palette.primary) {
  const x = doc.x, y = doc.y;
  const w = doc.widthOfString(text) + 14;
  const h = 16;
  doc.roundedRect(x, y, w, h, 8).fill(color);
  doc.fill('#fff');
  useFont(doc, 'App-Medium', 9);
  doc.text(text, x + 7, y + 3);
  doc.moveDown(1.2);
}

export function kv(doc: PDFDocumentType, rows: Array<[string, string]>, opts?: { cols?: number }) {
  const { margin } = page;
  const cols = opts?.cols ?? 2;
  const colW = (doc.page.width - margin * 2) / cols;
  const startY = doc.y;

  rows.forEach((r, i) => {
    const x = margin + (i % cols) * colW;
    const y = startY + Math.floor(i / cols) * 16;
    useFont(doc, 'App-Medium', 9);
    doc.fillColor(palette.subtext).text(r[0], x, y);
    useFont(doc, 'App', 10);
    doc.fillColor(palette.ink).text(r[1], x, y + 10);
  });

  doc.moveDown(Math.ceil(rows.length / cols) + 0.5);
}

/** Fit columns to page width and return scaled copies with x offsets precomputed. */
function normalizeColumns(doc: PDFDocumentType, cols: Col[]) {
  const { margin } = page;
  const available = doc.page.width - margin * 2;

  if (!cols || cols.length === 0) {
    return { scaled: [] as Col[], positions: [] as number[] };
  }

  const total = cols.reduce((s, c) => s + c.width, 0);
  const scale = total > available ? available / total : 1;

  const scaled = cols.map((c) => ({ ...c, width: Math.max(20, c.width * scale) }));

  // compute x offsets
  const positions: number[] = [];
  let acc = margin;
  for (const c of scaled) {
    positions.push(acc);
    acc += c.width;
  }

  // Guard: shrink last column if we overshoot
  const overshoot = acc - (doc.page.width - margin);
  const lastIdx = scaled.length - 1;
  if (overshoot > 0 && lastIdx >= 0) {
    if (scaled[lastIdx]) {
      scaled[lastIdx].width = Math.max(20, scaled[lastIdx].width - overshoot);
    }
  }

  return { scaled, positions };
}

/** Safer table with auto-fit columns & robust pagination */
export function table(doc: PDFDocumentType, cols: Col[], rows: any[], opts?: { zebra?: boolean }) {
  if (!cols || cols.length === 0) return;

  const { margin } = page;
  const { scaled, positions } = normalizeColumns(doc, cols);

  // If something went wrong, bail safely
  if (scaled.length === 0 || positions.length === 0) return;

  let y = doc.y + 6;
  const headerHeight = 18;
  const rowHeight = 18;
  const bottomGuard = 100; // keep footer space

  // draw header
  useFont(doc, 'App-Medium', 10);
  doc.fillColor(palette.text);
  scaled.forEach((c, i) => {
    const x = positions[i] ?? margin; // <- safe index
    doc.text(c.header, x, y, { width: c.width, align: c.align ?? 'left' });
  });

  y += headerHeight;
  doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).strokeColor(palette.line).lineWidth(1).stroke();
  y += 6;

  // helper to start a new page with header again
  const newPageWithHeader = () => {
    doc.addPage();
    y = doc.y + 6;
    useFont(doc, 'App-Medium', 10);
    doc.fillColor(palette.text);
    scaled.forEach((c, i) => {
      const x = positions[i] ?? margin; // <- safe index
      doc.text(c.header, x, y, { width: c.width, align: c.align ?? 'left' });
    });
    y += headerHeight + 6;
  };

  // rows
  (rows ?? []).forEach((r, idx) => {
    // page break if needed
    if (y + rowHeight > doc.page.height - bottomGuard) {
      newPageWithHeader();
    }

    // zebra
    if (opts?.zebra && idx % 2 === 0) {
      doc
        .rect(margin, y - 4, doc.page.width - margin * 2, rowHeight + 8)
        .fillOpacity(1)
        .fill(palette.zebra)
        .fillOpacity(1);
    }

    // cells
    scaled.forEach((c, i) => {
      const x = positions[i] ?? margin; // <- safe index
      const v = (c.key ? r[c.key] : r[i]) ?? '';
      useFont(doc, 'App', 10);
      doc.fillColor(palette.ink).text(String(v), x, y, { width: c.width, align: c.align ?? 'left' });
    });

    y += rowHeight;
  });

  doc.moveDown(1.2);
}

export function totalsBox(doc: PDFDocumentType, lines: Array<[string, string]>) {
  if (!lines || lines.length === 0) return;

  const { margin } = page;
  const w = 220;
  const x = doc.page.width - margin - w;
  const y = doc.y + 10;

  doc.roundedRect(x, y, w, lines.length * 20 + 26, 10).strokeColor(palette.line).lineWidth(1).stroke();

  let cy = y + 10;
  lines.forEach(([k, v], i) => {
    useFont(doc, 'App', 10);
    doc.fillColor(palette.subtext).text(k, x + 12, cy, { width: w / 2 - 12 });
    useFont(doc, i === lines.length - 1 ? 'App-Bold' : 'App', 11);
    doc.fillColor(palette.ink).text(v, x + w / 2, cy, { width: w / 2 - 12, align: 'right' });
    cy += 20;
  });

  doc.moveDown(lines.length / 2 + 1);
}
