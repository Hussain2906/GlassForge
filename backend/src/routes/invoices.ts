import { Router } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { nextNumber } from '../services/numbering';
import { computeGST } from '../services/tax';

const prisma = new PrismaClient();
const r = Router();

// Create invoice from an order
// POST /api/v1/invoices/from-order/:orderId
// body: { organizationId: string, taxMode?: 'INTRA' | 'INTER' }
r.post('/from-order/:orderId', async (req, res) => {
  try {
    const { organizationId, taxMode = 'INTRA' } = req.body as {
      organizationId: string;
      taxMode?: 'INTRA' | 'INTER';
    };
    if (!organizationId) return res.status(400).json({ error: 'organizationId required' });

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Order belongs to a different organization' });
    }

    // subtotal from order items
    const subtotal = order.items.reduce((s, it) => s + Number(it.lineTotal ?? 0), 0);

    // fetch org tax rates if present (fallback to defaults)
    const taxes = await prisma.taxRate.findMany({ where: { organizationId } });
    const rateBy = (name: string, fallback: number) =>
      Number(taxes.find(t => t.name.toUpperCase() === name)?.rate ?? fallback);

    const cgst = rateBy('CGST', 0.09);
    const sgst = rateBy('SGST', 0.09);
    const igst = rateBy('IGST', 0.18);

    const { tax, breakdown } = computeGST(subtotal, taxMode, cgst, sgst, igst);
    const total = +(subtotal + tax).toFixed(2);

    const invoiceNo = await nextNumber(organizationId, 'INVOICE');

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        invoiceNo,
        orderId: order.id,
        date: new Date(),
        subtotal,
        taxBreakdown: breakdown, // { cgst, sgst, igst }
        total,
        paymentStatus: PaymentStatus.UNPAID,
        notes: order.notes ?? null
      },
      include: { payments: true }
    });

    // Optional: initialize order balance to invoice total (if you want)
    await prisma.order.update({
      where: { id: order.id },
      data: { balanceAmount: total }
    });

    res.json(invoice);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message ?? 'internal error' });
  }
});

// Record a payment for an invoice
// POST /api/v1/invoices/:invoiceId/payments
// body: { organizationId: string, amount: number, method?: string, reference?: string }
r.post('/:invoiceId/payments', async (req, res) => {
  try {
    const { organizationId, amount, method, reference } = req.body as {
      organizationId: string;
      amount: number;
      method?: string;
      reference?: string;
    };
    if (!organizationId) return res.status(400).json({ error: 'organizationId required' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'valid amount required' });

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.invoiceId },
      include: { payments: true, order: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Invoice belongs to a different organization' });
    }

    // create payment
    await prisma.payment.create({
      data: {
        organizationId,
        invoiceId: invoice.id,
        amount,
        method: method ?? null,
        reference: reference ?? null
      }
    });

    // recompute totals
    const agg = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true }
    });
    const paid = Number(agg._sum.amount ?? 0);
    const total = Number(invoice.total ?? 0);

    let newStatus: PaymentStatus = PaymentStatus.UNPAID;
    if (paid <= 0) newStatus = PaymentStatus.UNPAID;
    else if (paid < total) newStatus = PaymentStatus.PARTIAL;
    else newStatus = PaymentStatus.PAID;

    // update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentStatus: newStatus },
      include: { payments: true }
    });

    // optional: update order balance
    if (invoice.orderId) {
      await prisma.order.update({
        where: { id: invoice.orderId },
        data: { balanceAmount: Math.max(0, +(total - paid).toFixed(2)) }
      });
    }

    res.json(updatedInvoice);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message ?? 'internal error' });
  }
});

// List invoices (latest first)
r.get('/', async (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  const invoices = await prisma.invoice.findMany({
    take: limit,
    orderBy: { id: 'desc' },
    select: { id: true, invoiceNo: true, total: true, paymentStatus: true }
  });
  res.json(invoices);
});

// Get one invoice (with payments)
r.get('/:id', async (req, res) => {
  const inv = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { payments: true, order: { include: { items: true } } }
  });
  if (!inv) return res.status(404).json({ error: 'Not found' });
  res.json(inv);
});

/**
 * Update invoice payment status
 * PATCH /api/v1/invoices/:id/status
 * body: { paymentStatus: PaymentStatus }
 */
r.patch('/:id/status', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    if (!paymentStatus) {
      return res.status(400).json({ error: 'payment_status_required' });
    }

    const validStatuses = ['UNPAID', 'PARTIAL', 'PAID'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'invalid_payment_status' });
    }

    const invoice = await prisma.invoice.update({
      where: { id, organizationId: orgId },
      data: { paymentStatus: paymentStatus as PaymentStatus }
    });

    return res.json(invoice);
  } catch (err) {
    console.error('Update invoice status failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default r;
