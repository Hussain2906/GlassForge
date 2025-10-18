import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { computeLine } from '../services/pricing';
import { nextNumber } from '../services/numbering';
import { computeGST } from '../services/tax';

const prisma = new PrismaClient();
const r = Router();

// GET /api/v1/quotes - list quotes for organization
r.get('/', async (req, res) => {
  try {
    const auth = (req as any).auth;
    const orgId = req.headers['x-org-id'] as string;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const quotes = await prisma.quote.findMany({
      where: { organizationId: orgId },
      orderBy: { quoteNo: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        quoteNo: true,
        total: true,
        date: true,
        status: true
      }
    });

    return res.json(quotes);
  } catch (err) {
    console.error('List quotes failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/v1/quotes/:id - get single quote
r.get('/:id', async (req, res) => {
  try {
    const auth = (req as any).auth;
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        organizationId: orgId
      },
      include: { items: true }
    });

    if (!quote) {
      return res.status(404).json({ error: 'quote_not_found' });
    }

    return res.json(quote);
  } catch (err) {
    console.error('Get quote failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// validate and coerce incoming payload (numbers come as strings from forms sometimes)
const CreateQuoteSchema = z.object({
  organizationId: z.string().min(1),
  clientId: z.string().optional().nullable(),
  taxMode: z.enum(['INTRA', 'INTER']).default('INTRA'),
  minCharge: z.coerce.number().nonnegative().default(0),
  wastagePercent: z.coerce.number().min(0).max(95).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1),
    thicknessMm: z.coerce.number().positive(),
    lengthFt: z.coerce.number().positive(),
    widthFt: z.coerce.number().positive(),
    qty: z.coerce.number().int().positive().default(1),
    unitPrice: z.coerce.number().nonnegative(),
    processes: z.array(z.object({
      priceRule: z.enum(['PER_AREA', 'PER_EDGE', 'FLAT']),
      rate: z.coerce.number().nonnegative(),
      unit: z.string().optional()
    })).default([])
  })).min(1)
});

r.post('/', async (req, res) => {
  try {
    const input = CreateQuoteSchema.parse(req.body);

    let subtotal = 0;
    const computedItems = input.items.map((it) => {
      const c = computeLine(
        it.unitPrice,
        it.lengthFt,
        it.widthFt,
        it.qty,
        it.processes as any,
        input.minCharge,
        input.wastagePercent
      );
      subtotal += c.lineTotal;
      return { ...it, ...c };
    });

    const { tax, breakdown } = computeGST(subtotal, input.taxMode);
    const total = +(subtotal + tax).toFixed(2);
    const quoteNo = await nextNumber(input.organizationId, 'QUOTE');

    const q = await prisma.quote.create({
      data: {
        organizationId: input.organizationId,
        quoteNo,
        clientId: input.clientId ?? null,
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        notes: input.notes ?? null,
        items: {
          create: computedItems.map((it) => ({
            organizationId: input.organizationId,
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
            processes: it.processes
          }))
        },
        customFields: { taxBreakdown: breakdown }
      },
      include: { items: true }
    });

    return res.json(q);
  } catch (err: any) {
    // log the full error so you can see exactly why it failed
    console.error('Create quote failed:', err);
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid_request', details: err.flatten() });
    }
    
    // Handle Prisma unique constraint errors
    if (err.code === 'P2002' && err.meta?.target?.includes('quoteNo')) {
      console.error('Duplicate quote number detected, retrying...');
      // This shouldn't happen with our improved numbering service, but just in case
      return res.status(500).json({ 
        error: 'Quote number generation failed. Please try again.',
        code: 'DUPLICATE_QUOTE_NUMBER'
      });
    }
    
    return res.status(500).json({ error: 'server_error' });
  }
});

export default r;
