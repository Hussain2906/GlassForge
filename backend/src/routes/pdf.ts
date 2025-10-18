// src/routes/pdf.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

import { stream, renderDocument } from '../pdf/engine';
import { quoteSpec } from '../pdf/templates/quote';
import { orderSpec } from '../pdf/templates/order';
import { invoiceSpec } from '../pdf/templates/invoice';

const prisma = new PrismaClient();
const r = Router();

r.get('/quote/:id', async (req, res) => {
  const q = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: { items: true, organization: true, client: true }
  });
  if (!q) return res.status(404).send('Not found');

  stream(res, (doc) => renderDocument(doc, quoteSpec(q)), `QUOTE_${q.quoteNo}`);
});

r.get('/order/:id', async (req, res) => {
  const o = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, organization: true, client: true }
  });
  if (!o) return res.status(404).send('Not found');

  stream(res, (doc) => renderDocument(doc, orderSpec(o)), `ORDER_${o.orderNo}`);
});

r.get('/invoice/:id', async (req, res) => {
  const inv = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { organization: true, order: { include: { items: true, client: true } }, payments: true }
  });
  if (!inv) return res.status(404).send('Not found');

  stream(res, (doc) => renderDocument(doc, invoiceSpec(inv)), `INVOICE_${inv.invoiceNo}`);
});

export default r;
