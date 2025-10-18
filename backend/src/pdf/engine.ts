// src/pdf/engine.ts
import PDFDocument from 'pdfkit';
type PDFDocumentType = InstanceType<typeof PDFDocument>;

import { page } from './theme';
import { initDoc, drawHeader, drawFooter, pill as pillCmp, kv, table, totalsBox } from './components';
import { useFont } from './theme';
import fs from 'fs';
import path from 'path';

export type TableCol = { header: string; width: number; align?: 'left'|'right'|'center'; key: string };

export type DocSpec = {
  filename: string;
  header: {
    title: string;
    org: { name: string; gstNumber?: string; addressLine1?: string; phone?: string; email?: string };
    subtitle?: string;
    rightMeta?: string;
    logoPath?: string | null;
  };
  kvRows?: Array<[string, string]>;
  columns: readonly TableCol[];
  rows: any[];
  totals?: Array<[string, string]>;
  pill?: { text: string; color?: string };
  notes?: string;
};

export function logoPathForOrg(): string | null {
  const p = path.join(process.cwd(), 'assets', 'logo.png');
  return fs.existsSync(p) ? p : null;
}

export function stream(res: any, build: (doc: PDFDocumentType)=>void, filename='document') {
  const doc = new PDFDocument({ margin: page.margin });
  initDoc(doc);

  // set headers once, before piping
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);

  // if pdfkit errors mid-stream, just end the response (don’t bubble to Express)
  doc.on('error', (err) => {
    console.error('[PDF ERROR]', err);
    try { res.end(); } catch {}
  });

  doc.pipe(res);

  try {
    build(doc);
    // Ensure footer on the first page too
    drawFooter(doc, (doc as any).__pageNo || 1);
    doc.end();
  } catch (e) {
    console.error('[PDF BUILD ERROR]', e);
    // We can’t change headers now; just end the doc/stream quietly.
    try { doc.end(); } catch {}
  }
}

export function renderDocument(doc: PDFDocumentType, spec: DocSpec) {
  const { header, kvRows, columns, rows, totals, pill, notes } = spec;

  drawHeader(doc, header);

  if (pill) pillCmp(doc, pill.text, pill.color);

  if (kvRows?.length) kv(doc, kvRows);

  const cols = columns as ReadonlyArray<TableCol>;
  table(
    doc,
    cols.map(c => ({ header: c.header, width: c.width, align: c.align ?? 'left', key: c.key })),
    rows,
    { zebra: true }
  );

  if (totals?.length) totalsBox(doc, totals);

  if (notes) {
    doc.moveDown(1.2);
    // ✅ Use safe font helper (falls back to Helvetica if custom fonts missing)
    useFont(doc, 'App-Medium', 10);
    doc.fillColor('#6b7280').text('Notes');
    useFont(doc, 'App', 10);
    doc.fillColor('#111827').text(notes);
  }
}
