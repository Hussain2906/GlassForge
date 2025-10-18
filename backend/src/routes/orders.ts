import { Router } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { nextNumber } from '../services/numbering';

const prisma = new PrismaClient();
const r = Router();

/**
 * Convert a Quote -> Order
 * POST /api/v1/orders/from-quote/:quoteId
 * body: { organizationId: string }
 */
r.post('/from-quote/:quoteId', async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) return res.status(400).json({ error: 'organizationId required' });

    const quote = await prisma.quote.findUnique({
      where: { id: req.params.quoteId },
      include: { items: true }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Quote belongs to a different organization' });
    }

    const orderNo = await nextNumber(organizationId, 'ORDER');

    const order = await prisma.order.create({
      data: {
        organizationId,
        orderNo,
        clientId: quote.clientId,
        notes: quote.notes ?? null,
        items: {
          create: quote.items.map((it) => ({
            organizationId,
            productId: it.productId ?? null,
            productName: it.productName,
            thicknessMm: it.thicknessMm,
            lengthFt: it.lengthFt,
            widthFt: it.widthFt,
            qty: it.qty,
            unitPrice: it.unitPrice,
            processCost: it.processCost,
            areaSqFt: it.areaSqFt,
            lineTotal: it.lineTotal,
            processes: it.processes ?? []
          }))
        }
      },
      include: { items: true }
    });

    res.json(order);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message ?? 'internal error' });
  }
});

/**
 * Transition order status
 * POST /api/v1/orders/:id/transition
 * body: { to: OrderStatus }
 */
r.post('/:id/transition', async (req, res) => {
  try {
    const { to } = req.body as { to: OrderStatus };
    if (!to) return res.status(400).json({ error: 'to status required' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: to }
    });
    res.json(updated);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message ?? 'internal error' });
  }
});

/** List latest orders */
r.get('/', async (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { id: 'desc' },
    select: { id: true, orderNo: true, status: true, clientId: true }
  });
  res.json(orders);
});

/** Get one order (with items) */
r.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true }
  });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

export default r;
