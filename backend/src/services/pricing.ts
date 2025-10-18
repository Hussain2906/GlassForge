export type PriceRule = 'PER_AREA' | 'PER_EDGE' | 'FLAT';

export type Process = {
  priceRule: PriceRule;
  rate: number;     // ₹ per sq.ft (PER_AREA), per edge (PER_EDGE), or flat
  unit?: string;
};

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** area in sq.ft from ft */
export function areaSqFt(lengthFt: number, widthFt: number) {
  return lengthFt * widthFt;
}

/** naive perimeter edges count for rectangle: 4 edges (can extend later) */
export function edgesCount() {
  return 4;
}

export function computeProcessCost(
  processes: Process[],
  area: number,    // sq.ft
  qty: number
) {
  let total = 0;
  for (const p of processes) {
    if (p.priceRule === 'PER_AREA') total += p.rate * area * qty;
    else if (p.priceRule === 'PER_EDGE') total += p.rate * edgesCount() * qty;
    else if (p.priceRule === 'FLAT') total += p.rate * qty;
  }
  return round2(total);
}

export function computeLine(
  unitPrice: number,
  lengthFt: number,
  widthFt: number,
  qty: number,
  processes: Process[],
  minCharge = 0,
  wastagePercent = 0
) {
  const baseArea = areaSqFt(lengthFt, widthFt);
  const areaWithWaste = baseArea * (1 + (wastagePercent / 100));
  const base = unitPrice * areaWithWaste * qty;
  const process = computeProcessCost(processes, baseArea, qty);
  const line = Math.max(base + process, minCharge || 0);
  return {
    areaSqFt: round2(baseArea),
    processCost: process,
    lineTotal: round2(line),
  };
}

export function computeGST(subtotal: number, taxMode: 'INTRA'|'INTER') {
  const rate = 0.18; // 18%
  const tax = round2(subtotal * rate);
  return {
    tax,
    breakdown: taxMode === 'INTRA'
      ? { cgst: round2(tax / 2), sgst: round2(tax / 2), igst: 0 }
      : { cgst: 0, sgst: 0, igst: tax }
  };
}
