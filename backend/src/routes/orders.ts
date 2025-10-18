import { Router } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { nextNumber } from '../services/numbering';
import { calculateLineItem, LineItemInput } from '../services/glass-calculation';

const prisma = new PrismaClient();
const r = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ProcessInputSchema = z.object({
  processCode: z.string().min(1),
  overrideRate: z.coerce.number().nonnegative().optional()
});

const CalculateLineSchema = z.object({
  thicknessMm: z.coerce.number().positive({ message: 'Thickness must be greater than 0' }),
  glassType: z.string().min(1, { message: 'Glass type is required' }),
  widthMm: z.coerce.number().positive().optional(),
  heightMm: z.coerce.number().positive().optional(),
  widthInch: z.coerce.number().positive().optional(),
  heightInch: z.coerce.number().positive().optional(),
  quantity: z.coerce.number().int().min(1).max(999999, { message: 'Quantity must be between 1 and 999999' }),
  processes: z.array(ProcessInputSchema).optional(),
  discountRate: z.coerce.number().nonnegative().optional(),
  perimeterCoeffW: z.coerce.number().positive().optional(),
  perimeterCoeffH: z.coerce.number().positive().optional()
}).refine(
  (data) => {
    // Must have either mm or inch dimensions
    const hasMm = data.widthMm !== undefined && data.heightMm !== undefined;
    const hasInch = data.widthInch !== undefined && data.heightInch !== undefined;
    return hasMm || hasInch;
  },
  {
    message: 'Either widthMm/heightMm or widthInch/heightInch must be provided'
  }
);

/**
 * POST /api/v1/orders/calculate-line
 * Calculate a single line item for preview/validation
 * 
 * This endpoint performs all calculations without saving to database.
 * Used for real-time calculation display in the UI.
 */
r.post('/calculate-line', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Validate input
    const input = CalculateLineSchema.parse(req.body);

    // Perform calculation
    const result = await calculateLineItem(orgId, input as LineItemInput);

    res.json(result);
  } catch (error: any) {
    console.error('Error calculating line item:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.flatten(),
        message: error.issues[0]?.message || 'Invalid input'
      });
    }

    if (error.message) {
      return res.status(400).json({ 
        error: 'Calculation error',
        message: error.message
      });
    }

    res.status(500).json({ error: 'Failed to calculate line item' });
  }
});

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

/**
 * Update order status (simpler endpoint)
 * PATCH /api/v1/orders/:id/status
 * body: { status: OrderStatus }
 */
r.patch('/:id/status', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;
    const { status } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status_required' });
    }

    const validStatuses = ['NEW', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const order = await prisma.order.update({
      where: { id, organizationId: orgId },
      data: { status: status as OrderStatus }
    });

    return res.json(order);
  } catch (err) {
    console.error('Update order status failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** List latest orders */
r.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);

    const orders = await prisma.order.findMany({
      where: { organizationId: orgId },
      orderBy: { orderNo: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        orderNo: true,
        status: true,
        orderDate: true,
        clientId: true,
        subtotal: true,
        billAmount: true,
        client: {
          select: {
            name: true,
            phone: true,
            gstNumber: true
          }
        }
      }
    });

    // Transform to include client info at top level
    const transformed = orders.map(o => ({
      ...o,
      clientName: o.client?.name || null,
      clientPhone: o.client?.phone || null,
      gstNumber: o.client?.gstNumber || null,
      total: o.billAmount || o.subtotal || 0,
      date: o.orderDate,
      client: undefined // Remove nested client object
    }));

    return res.json(transformed);
  } catch (err) {
    console.error('List orders failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** Get one order (with items) */
r.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { 
        items: true,
        client: {
          select: {
            name: true,
            phone: true,
            gstNumber: true
          }
        }
      }
    });
    
    if (!order) return res.status(404).json({ error: 'Not found' });
    
    // Transform to include client info at top level
    const transformed = {
      ...order,
      clientName: order.client?.name || null,
      clientPhone: order.client?.phone || null,
      clientGstNumber: order.client?.gstNumber || null,
      client: undefined // Remove nested client object
    };
    
    res.json(transformed);
  } catch (err) {
    console.error('Get order failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default r;
