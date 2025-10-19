// src/pdf/templates/invoice.ts
import { DocSpec, TableCol, logoPathForOrg } from '../engine';
import { inr, palette } from '../theme';

export function invoiceSpec(inv: any): DocSpec {
  const cols: readonly TableCol[] = [
    { header: 'Item',       width: 260, key: 'c0' },
    { header: 'Qty',        width: 60,  align: 'right', key: 'c1' },
    { header: 'Area (sqm)', width: 90,  align: 'right', key: 'c2' },
    { header: 'Line Total', width: 120, align: 'right', key: 'c3' },
  ] as const;

  const items = inv.order?.items ?? [];
  const rows = items.map((it: any) => ({
    c0: `${it.productName} ${it.thicknessMm ?? ''}mm ${it.lengthMm}×${it.widthMm}`,
    c1: it.qty,
    c2: Number(it.areaSqm ?? 0).toFixed(2),
    c3: inr(Number(it.lineTotal ?? 0)),
  }));

  const paid = (inv.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const subtotalNum = Number(inv.subtotal || 0);
  const totalNum = Number(inv.total || 0);
  const due = Math.max(0, totalNum - paid);
  const tb = (inv as any).taxBreakdown || { cgst: 0, sgst: 0, igst: 0 };

  const totals: Array<[string,string]> = [];
  totals.push(['Subtotal', inr(subtotalNum)]);
  if (Number(tb.cgst)) totals.push(['CGST', inr(Number(tb.cgst))]);
  if (Number(tb.sgst)) totals.push(['SGST', inr(Number(tb.sgst))]);
  if (Number(tb.igst)) totals.push(['IGST', inr(Number(tb.igst))]);
  totals.push(['Total', inr(totalNum)]);
  totals.push(['Paid', inr(paid)]);
  totals.push(['Amount Due', inr(due)]);

  const org = inv.organization ?? {};
  const header: DocSpec['header'] = {
    title: `Invoice ${inv.invoiceNo}`,
    org: {
      name: String(org?.name ?? 'Organization'),
      gstNumber: org?.gstNumber ?? undefined,
      addressLine1: org?.addressLine1 ?? undefined,
      phone: org?.phone ?? undefined,
      email: org?.email ?? undefined,
    },
    logoPath: logoPathForOrg(),
  };
  const clientName = inv.order?.client?.name as string | undefined;
  if (clientName) header.subtitle = `Bill To: ${clientName}`;
  if (inv.date) header.rightMeta = `Date: ${new Date(inv.date).toLocaleDateString('en-IN')}`;

  const pill = { text: due === 0 ? 'PAID' : 'DUE', color: due === 0 ? palette.success : palette.warn };

  return {
    filename: `INVOICE_${inv.invoiceNo}`,
    header,
    columns: cols,
    rows,
    totals,
    pill,
  };
}
