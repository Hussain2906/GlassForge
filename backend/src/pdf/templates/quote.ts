// src/pdf/templates/quote.ts
import { DocSpec, TableCol, logoPathForOrg } from '../engine';
import { inr } from '../theme';

export function quoteSpec(q: any): DocSpec {
  const cols: readonly TableCol[] = [
    { header: 'Item',       width: 220, key: 'col0' },
    { header: 'Qty',        width: 50,  align: 'right', key: 'col1' },
    { header: 'Area (sqm)', width: 80,  align: 'right', key: 'col2' },
    { header: 'Process ₹',  width: 80,  align: 'right', key: 'col3' },
    { header: 'Unit ₹',     width: 70,  align: 'right', key: 'col4' },
    { header: 'Line Total', width: 100, align: 'right', key: 'col5' },
  ] as const;

  const rows = (q.items ?? []).map((it: any) => ({
    col0: `${it.productName} ${it.thicknessMm ?? ''}mm ${it.lengthMm}×${it.widthMm}`,
    col1: it.qty,
    col2: Number(it.areaSqm ?? 0).toFixed(2),
    col3: inr(Number(it.processCost ?? 0)),
    col4: inr(Number(it.unitPrice ?? 0)),
    col5: inr(Number(it.lineTotal ?? 0)),
  }));

  const tb = (q.customFields?.taxBreakdown) ?? { cgst: 0, sgst: 0, igst: 0 };
  const totals: Array<[string,string]> = [];
  totals.push(['Subtotal', inr(Number(q.subtotal || 0))]);
  if (Number(tb.cgst)) totals.push(['CGST', inr(Number(tb.cgst))]);
  if (Number(tb.sgst)) totals.push(['SGST', inr(Number(tb.sgst))]);
  if (Number(tb.igst)) totals.push(['IGST', inr(Number(tb.igst))]);
  totals.push(['Total', inr(Number(q.total || 0))]);

  const org = q.organization ?? {};
  const header: DocSpec['header'] = {
    title: `Quotation ${q.quoteNo}`,
    org: {
      name: String(org?.name ?? 'Organization'),
      gstNumber: org?.gstNumber ?? undefined,
      addressLine1: org?.addressLine1 ?? undefined,
      phone: org?.phone ?? undefined,
      email: org?.email ?? undefined,
    },
    logoPath: logoPathForOrg(),
  };
  if (q.client?.name) header.subtitle = `To: ${q.client.name}`;
  if (q.date) header.rightMeta = `Date: ${new Date(q.date).toLocaleDateString('en-IN')}`;

  const kvRows: Array<[string,string]> = [];
  if (q.client) {
    kvRows.push(['Client', String(q.client.name ?? '—')]);
    kvRows.push(['Phone', String(q.client.phone ?? '—')]);
    kvRows.push(['GSTIN', String(q.client.gstNumber ?? '—')]);
  }

  return {
    filename: `QUOTE_${q.quoteNo}`,
    header,
    kvRows,
    columns: cols,
    rows,
    totals,
    notes: q.notes ?? undefined,
  };
}
