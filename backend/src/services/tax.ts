export function computeGST(
    subtotal: number,
    mode: 'INTRA'|'INTER',
    cgst=0.09,
    sgst=0.09,
    igst=0.18
  ) {
    if (mode === 'INTRA') {
      const cg = +(subtotal * cgst).toFixed(2);
      const sg = +(subtotal * sgst).toFixed(2);
      return { tax: +(cg+sg).toFixed(2), breakdown: { cgst: cg, sgst: sg, igst: 0 } };
    } else {
      const ig = +(subtotal * igst).toFixed(2);
      return { tax: ig, breakdown: { cgst: 0, sgst: 0, igst: ig } };
    }
  }
  