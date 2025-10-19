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

  // Soft lavender background header
  doc.rect(0, 0, doc.page.width, 120).fill(palette.lightBg);

  // Company name with elegant styling
  doc.fillColor(palette.primary);
  useFont(doc, 'App-Bold', 24);
  doc.text(org.name || 'GlassForge', margin, 30);
  
  useFont(doc, 'App', 11);
  doc.fillColor(palette.text).text('Professional Glass Solutions', margin, 60);

  // logo (optional) - positioned top right
  if (logoPath) {
    try {
      doc.image(logoPath, doc.page.width - margin - 100, 25, { width: 80, height: 40, fit: [80, 40] });
    } catch { /* ignore */ }
  }

  // Document title (QUOTATION/INVOICE/ORDER) - top right
  const titleWidth = 160;
  doc.fillColor(palette.primary);
  useFont(doc, 'App-Bold', 22);
  doc.text(title, doc.page.width - margin - titleWidth, 30, { width: titleWidth, align: 'right' });

  // Right meta (Quote #, Date) below title
  if (typeof rightMeta === 'string') {
    useFont(doc, 'App', 11);
    doc.fillColor(palette.text).text(rightMeta, doc.page.width - margin - titleWidth, 60, { 
      width: titleWidth, 
      align: 'right' 
    });
  }

  // Customer info card (if subtitle exists)
  if (typeof subtitle === 'string') {
    const cardY = 140;
    const cardHeight = 70;
    const contentWidth = doc.page.width - margin * 2;
    
    // Card background with border
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 8)
       .fillAndStroke(palette.lightBg, palette.line);
    
    // "Bill To:" label
    doc.fillColor(palette.primary);
    useFont(doc, 'App-Bold', 12);
    doc.text('Bill To:', margin + 15, cardY + 15);
    
    // Customer name
    doc.fillColor(palette.ink);
    useFont(doc, 'App', 11);
    doc.text(subtitle.replace('Bill To: ', ''), margin + 15, cardY + 35);
    
    // GST number on the right if available
    if (org.gstNumber) {
      doc.fillColor(palette.text);
      useFont(doc, 'App', 10);
      doc.text(`GSTIN: ${org.gstNumber}`, margin + 300, cardY + 35);
    }
    
    doc.y = cardY + cardHeight + 20;
  } else {
    doc.y = 140;
  }
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

  // Left side - Thank you message
  useFont(doc, 'App-Bold', 10);
  doc.fillColor(palette.primary).text(
    'Thank you for your business!',
    margin,
    textY,
    { width: 300, align: 'left' }
  );

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
  useFont(doc, 'App-Bold', 10);
  const w = doc.widthOfString(text) + 20;
  const h = 20;
  doc.roundedRect(x, y, w, h, 10).fill(color);
  doc.fillColor('#fff');
  useFont(doc, 'App-Bold', 10);
  doc.text(text, x + 10, y + 5);
  doc.moveDown(1.5);
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

  let y = doc.y + 10;
  const headerHeight = 28;
  const rowHeight = 24;
  const bottomGuard = 100; // keep footer space
  const contentWidth = doc.page.width - margin * 2;

  // draw header with purple background
  doc.rect(margin, y, contentWidth, headerHeight).fill(palette.primary);
  
  useFont(doc, 'App-Bold', 11);
  doc.fillColor('white');
  scaled.forEach((c, i) => {
    const x = positions[i] ?? margin;
    doc.text(c.header, x + 8, y + 10, { width: c.width - 16, align: c.align ?? 'left' });
  });

  y += headerHeight;

  // helper to start a new page with header again
  const newPageWithHeader = () => {
    doc.addPage();
    y = doc.y + 10;
    
    // Redraw header
    doc.rect(margin, y, contentWidth, headerHeight).fill(palette.primary);
    useFont(doc, 'App-Bold', 11);
    doc.fillColor('white');
    scaled.forEach((c, i) => {
      const x = positions[i] ?? margin;
      doc.text(c.header, x + 8, y + 10, { width: c.width - 16, align: c.align ?? 'left' });
    });
    y += headerHeight;
  };

  // rows with alternating colors
  (rows ?? []).forEach((r, idx) => {
    // page break if needed
    if (y + rowHeight > doc.page.height - bottomGuard) {
      newPageWithHeader();
    }

    // alternating row colors
    const rowColor = idx % 2 === 0 ? 'white' : palette.zebra;
    doc.rect(margin, y, contentWidth, rowHeight).fill(rowColor);

    // cells
    scaled.forEach((c, i) => {
      const x = positions[i] ?? margin;
      const v = (c.key ? r[c.key] : r[i]) ?? '';
      useFont(doc, 'App', 10);
      doc.fillColor(palette.ink).text(String(v), x + 8, y + 6, { 
        width: c.width - 16, 
        align: c.align ?? 'left' 
      });
    });

    y += rowHeight;
  });

  // Table border
  doc.rect(margin, doc.y + 10, contentWidth, y - (doc.y + 10))
     .strokeColor(palette.line)
     .lineWidth(1)
     .stroke();

  doc.moveDown(1.5);
}

export function totalsBox(doc: PDFDocumentType, lines: Array<[string, string]>) {
  if (!lines || lines.length === 0) return;

  const { margin } = page;
  const w = 250;
  const x = doc.page.width - margin - w;
  const y = doc.y + 20;
  const lineHeight = 22;
  const padding = 15;
  const boxHeight = lines.length * lineHeight + padding * 2;

  // Background box with border
  doc.roundedRect(x - 10, y, w + 20, boxHeight, 10)
     .fillAndStroke(palette.lightBg, palette.line);

  let cy = y + padding;
  lines.forEach(([k, v], i) => {
    const isTotal = i === lines.length - 1 || k.toLowerCase().includes('total');
    
    if (isTotal && i === lines.length - 1) {
      // Highlight the final total with purple background
      doc.roundedRect(x - 5, cy - 4, w + 10, lineHeight + 4, 6).fill(palette.primary);
      useFont(doc, 'App-Bold', 12);
      doc.fillColor('white').text(k, x, cy, { width: w / 2 });
      doc.fillColor('white').text(v, x + w / 2, cy, { width: w / 2, align: 'right' });
    } else {
      useFont(doc, 'App', 11);
      doc.fillColor(palette.text).text(k, x, cy, { width: w / 2 });
      useFont(doc, isTotal ? 'App-Bold' : 'App', 11);
      doc.fillColor(palette.ink).text(v, x + w / 2, cy, { width: w / 2, align: 'right' });
    }
    
    cy += lineHeight;
  });

  doc.moveDown(lines.length / 2 + 2);
}
