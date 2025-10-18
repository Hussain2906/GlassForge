export type PriceRule = 'PER_AREA' | 'PER_EDGE' | 'FLAT';

export type Process = {
  priceRule: PriceRule;
  rate: number;     // ₹ per m² (PER_AREA), per edge (PER_EDGE), or flat
  unit?: string;
};

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** area in m² from mm */
export function areaSqm(lengthMm: number, widthMm: number) {
  return (lengthMm / 1000) * (widthMm / 1000);
}

/** naive perimeter edges count for rectangle: 4 edges (can extend later) */
export function edgesCount() {
  return 4;
}

export function computeProcessCost(
  processes: Process[],
  area: number,    // m²
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
  lengthMm: number,
  widthMm: number,
  qty: number,
  processes: Process[],
  minCharge = 0,
  wastagePercent = 0
) {
  const baseArea = areaSqm(lengthMm, widthMm);
  const areaWithWaste = baseArea * (1 + (wastagePercent / 100));
  const base = unitPrice * areaWithWaste * qty;
  const process = computeProcessCost(processes, baseArea, qty);
  const line = Math.max(base + process, minCharge || 0);
  return {
    areaSqm: round2(baseArea),
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