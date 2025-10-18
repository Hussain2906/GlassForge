// src/pdf/templates/order.ts
import { DocSpec, TableCol, logoPathForOrg } from '../engine';
import { inr } from '../theme';

export function orderSpec(o: any): DocSpec {
  const cols: readonly TableCol[] = [
    { header: 'Item',       width: 260, key: 'c0' },
    { header: 'Qty',        width: 60,  align: 'right', key: 'c1' },
    { header: 'Area (sqm)', width: 90,  align: 'right', key: 'c2' },
    { header: 'Line Total', width: 120, align: 'right', key: 'c3' },
  ] as const;

  const rows = (o.items ?? []).map((it: any) => ({
    c0: `${it.productName} ${it.thicknessMm ?? ''}mm ${it.lengthMm}×${it.widthMm}`,
    c1: it.qty,
    c2: Number(it.areaSqm ?? 0).toFixed(2),
    c3: inr(Number(it.lineTotal ?? 0)),
  }));

  const totals: Array<[string,string]> = [];
  totals.push(['Advance', inr(Number(o.advanceAmount || 0))]);
  totals.push(['Balance', inr(Number(o.balanceAmount || 0))]);

  const org = o.organization ?? {};
  const header: DocSpec['header'] = {
    title: `Work Order ${o.orderNo}`,
    org: {
      name: String(org?.name ?? 'Organization'),
      gstNumber: org?.gstNumber ?? undefined,
      addressLine1: org?.addressLine1 ?? undefined,
      phone: org?.phone ?? undefined,
      email: org?.email ?? undefined,
    },
    logoPath: logoPathForOrg(),
  };
  if (o.client?.name) header.subtitle = `Client: ${o.client.name}`;
  header.rightMeta = `Status: ${o.status}`;

  return {
    filename: `ORDER_${o.orderNo}`,
    header,
    columns: cols,
    rows,
    totals,
    pill: { text: o.status },
  };
}
