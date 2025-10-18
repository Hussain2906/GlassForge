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
        status: true,
        clientId: true,
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
    const transformed = quotes.map(q => ({
      ...q,
      clientName: q.client?.name || null,
      clientPhone: q.client?.phone || null,
      gstNumber: q.client?.gstNumber || null,
      client: undefined // Remove nested client object
    }));

    return res.json(transformed);
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

// Helper functions for glass calculations
function mmToInch(mm: number): number {
  return mm / 25.4;
}

function inchToFt(inch: number, roundingStepInch = 3): number {
  const ft = inch / 12;
  const step = roundingStepInch / 12;
  return Math.ceil(ft / step) * step;
}

// Helper function to get glass rate with proper key mapping
function getGlassRateValue(glassRates: any[], glassType: string, thicknessMm: number): number {
  const glassRate = glassRates.find(r => r.glassType === glassType);
  
  if (!glassRate) {
    console.error(`❌ Glass rate not found for type: "${glassType}"`);
    console.error(`   Available types:`, glassRates.map(r => r.glassType));
    return 0;
  }
  
  // Build the key name based on thickness (handle 3.5mm special case)
  let thicknessKey: string;
  if (thicknessMm === 3.5) {
    thicknessKey = 'rate_3_5mm';
  } else {
    thicknessKey = `rate_${thicknessMm}mm`;
  }
  
  const rateValue = glassRate[thicknessKey];
  
  console.log(`🔍 Looking for ${glassType} ${thicknessMm}mm (key: ${thicknessKey})`);
  console.log(`   Raw value from DB:`, rateValue, `(type: ${typeof rateValue})`);
  console.log(`   Full glass rate object:`, JSON.stringify(glassRate, null, 2));
  
  if (rateValue === null || rateValue === undefined) {
    console.error(`❌ No rate found for ${glassType} at thickness ${thicknessMm}mm (key: ${thicknessKey})`);
    console.error(`   Available rates:`, {
      '3.5mm': glassRate.rate_3_5mm,
      '4mm': glassRate.rate_4mm,
      '5mm': glassRate.rate_5mm,
      '6mm': glassRate.rate_6mm,
      '8mm': glassRate.rate_8mm,
      '10mm': glassRate.rate_10mm,
      '12mm': glassRate.rate_12mm,
      '19mm': glassRate.rate_19mm
    });
    return 0;
  }
  
  // Handle Prisma Decimal type
  let unitPrice = 0;
  if (typeof rateValue === 'number') {
    unitPrice = rateValue;
  } else if (typeof rateValue === 'string') {
    unitPrice = parseFloat(rateValue);
  } else if (rateValue && typeof rateValue === 'object' && 'toNumber' in rateValue) {
    // Prisma Decimal type
    unitPrice = (rateValue as any).toNumber();
  }
  
  console.log(`   Converted to unitPrice: ${unitPrice}`);
  
  if (unitPrice > 0) {
    console.log(`✅ Found rate for ${glassType} ${thicknessMm}mm: ₹${unitPrice}/sq.ft`);
  } else {
    console.error(`❌ Unit price is 0 after conversion!`);
  }
  
  return unitPrice;
}

function computeDimensions(widthMm: number, heightMm: number) {
  const widthInch = mmToInch(widthMm);
  const heightInch = mmToInch(heightMm);
  const widthFt = inchToFt(widthInch);
  const heightFt = inchToFt(heightInch);
  const sqFt = widthFt * heightFt;
  return { widthInch, heightInch, widthFt, heightFt, sqFt };
}

// validate and coerce incoming payload (numbers come as strings from forms sometimes)
const CreateQuoteSchema = z.object({
  organizationId: z.string().min(1),
  clientId: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  taxMode: z.enum(['INTRA', 'INTER']).default('INTRA'),
  enableGST: z.boolean().default(true),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    glassType: z.string().min(1),
    thicknessMm: z.coerce.number().positive(),
    widthInch: z.coerce.number().positive(),
    heightInch: z.coerce.number().positive(),
    qty: z.coerce.number().int().positive().default(1),
    processes: z.array(z.object({
      processCode: z.string(),
      processName: z.string(),
      pricingType: z.enum(['F', 'A', 'L']),
      rate: z.coerce.number().nonnegative()
    })).default([])
  })).min(1)
});

r.post('/', async (req, res) => {
  try {
    const input = CreateQuoteSchema.parse(req.body);
    
    console.log('📝 Creating quote with', input.items.length, 'items');
    input.items.forEach((item, idx) => {
      console.log(`   Item ${idx + 1}: ${item.glassType} ${item.thicknessMm}mm - ${item.widthInch}"×${item.heightInch}" - Qty: ${item.qty}`);
    });

    // Fetch glass rates for the organization
    const glassRates = await prisma.glassRate.findMany({
      where: { organizationId: input.organizationId, isActive: true }
    });

    if (glassRates.length === 0) {
      console.error('❌ No glass rates found for organization:', input.organizationId);
      console.error('   Please add glass rates in Admin → Glass Rates');
    } else {
      console.log('✅ Found', glassRates.length, 'glass rates:', glassRates.map(r => r.glassType).join(', '));
    }

    let subtotal = 0;
    const computedItems = input.items.map((it) => {
      // Calculate dimensions from inches
      const widthFt = inchToFt(it.widthInch);
      const heightFt = inchToFt(it.heightInch);
      const sqFt = widthFt * heightFt;
      const totalArea = sqFt * it.qty;
      const totalLength = (widthFt + heightFt) * 2 * it.qty;

      // Get glass rate using helper function
      const unitPrice = getGlassRateValue(glassRates, it.glassType, it.thicknessMm);
      
      if (unitPrice === 0) {
        console.error(`Zero unit price for ${it.glassType} ${it.thicknessMm}mm - Available types:`, glassRates.map(r => r.glassType));
      }

      // Calculate base glass price
      const baseGlassPrice = unitPrice * totalArea;

      // Calculate process costs
      let processCost = 0;
      it.processes.forEach(proc => {
        if (proc.pricingType === 'F') {
          processCost += proc.rate * it.qty;
        } else if (proc.pricingType === 'A') {
          processCost += proc.rate * totalArea;
        } else if (proc.pricingType === 'L') {
          processCost += proc.rate * totalLength;
        }
      });

      const lineTotal = baseGlassPrice + processCost;
      subtotal += lineTotal;

      return {
        ...it,
        widthFt,
        heightFt,
        areaSqFt: sqFt,
        unitPrice,
        processCost,
        lineTotal: +(lineTotal.toFixed(2))
      };
    });

    // Apply discount
    const discountAmount = +(subtotal * (input.discountPercent / 100)).toFixed(2);
    const afterDiscount = +(subtotal - discountAmount).toFixed(2);

    // Calculate tax on discounted amount
    const taxRate = input.enableGST ? 0.18 : 0;
    const tax = +(afterDiscount * taxRate).toFixed(2);
    const breakdown = input.taxMode === 'INTRA'
      ? { cgst: +(tax / 2).toFixed(2), sgst: +(tax / 2).toFixed(2), igst: 0 }
      : { cgst: 0, sgst: 0, igst: tax };
    
    const total = +(afterDiscount + tax).toFixed(2);
    const quoteNo = await nextNumber(input.organizationId, 'QUOTE');

    const q = await prisma.quote.create({
      data: {
        organizationId: input.organizationId,
        quoteNo,
        clientId: input.clientId ?? null,
        date: input.date ? new Date(input.date) : new Date(),
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        notes: input.notes ?? null,
        items: {
          create: computedItems.map((it) => ({
            organizationId: input.organizationId,
            productName: `${it.glassType} ${it.thicknessMm}mm`,
            thicknessMm: it.thicknessMm,
            lengthFt: it.widthFt,
            widthFt: it.heightFt,
            qty: it.qty,
            unitPrice: it.unitPrice,
            processCost: it.processCost,
            areaSqFt: it.areaSqFt,
            lineTotal: it.lineTotal,
            processes: it.processes
          }))
        },
        customFields: { 
          taxBreakdown: breakdown,
          enableGST: input.enableGST,
          discountPercent: input.discountPercent,
          discountAmount
        }
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

// PATCH /api/v1/quotes/:id/status - update quote status
r.patch('/:id/status', async (req, res) => {
  try {
    const auth = (req as any).auth;
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;
    const { status } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    const validStatuses = ['DRAFT', 'SENT', 'FINALIZED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const quote = await prisma.quote.update({
      where: { id, organizationId: orgId },
      data: { status }
    });

    return res.json(quote);
  } catch (err) {
    console.error('Update quote status failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// DELETE /api/v1/quotes/:id - delete quote
r.delete('/:id', async (req, res) => {
  try {
    const auth = (req as any).auth;
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    // Check if quote exists and is in DRAFT status
    const existing = await prisma.quote.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'quote_not_found' });
    }

    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'can_only_delete_draft_quotes' });
    }

    // Delete quote (items will be cascade deleted)
    await prisma.quote.delete({
      where: { id }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete quote failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// PUT /api/v1/quotes/:id - update quote
r.put('/:id', async (req, res) => {
  try {
    const auth = (req as any).auth;
    const orgId = req.headers['x-org-id'] as string;
    const { id } = req.params;

    if (!orgId) {
      return res.status(400).json({ error: 'org_id_required' });
    }

    // Check if quote exists and belongs to organization
    const existing = await prisma.quote.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'quote_not_found' });
    }

    const input = CreateQuoteSchema.parse({ ...req.body, organizationId: orgId });

    // Fetch glass rates for the organization
    const glassRates = await prisma.glassRate.findMany({
      where: { organizationId: orgId, isActive: true }
    });

    if (glassRates.length === 0) {
      console.error('No glass rates found for organization:', orgId);
    }

    let subtotal = 0;
    const computedItems = input.items.map((it) => {
      // Calculate dimensions from inches
      const widthFt = inchToFt(it.widthInch);
      const heightFt = inchToFt(it.heightInch);
      const sqFt = widthFt * heightFt;
      const totalArea = sqFt * it.qty;
      const totalLength = (widthFt + heightFt) * 2 * it.qty;

      // Get glass rate using helper function
      const unitPrice = getGlassRateValue(glassRates, it.glassType, it.thicknessMm);
      
      if (unitPrice === 0) {
        console.error(`Zero unit price for ${it.glassType} ${it.thicknessMm}mm`);
      }

      // Calculate base glass price
      const baseGlassPrice = unitPrice * totalArea;

      // Calculate process costs
      let processCost = 0;
      it.processes.forEach(proc => {
        if (proc.pricingType === 'F') {
          processCost += proc.rate * it.qty;
        } else if (proc.pricingType === 'A') {
          processCost += proc.rate * totalArea;
        } else if (proc.pricingType === 'L') {
          processCost += proc.rate * totalLength;
        }
      });

      const lineTotal = baseGlassPrice + processCost;
      subtotal += lineTotal;

      return {
        ...it,
        widthFt,
        heightFt,
        areaSqFt: sqFt,
        unitPrice,
        processCost,
        lineTotal: +(lineTotal.toFixed(2))
      };
    });

    // Apply discount
    const discountAmount = +(subtotal * (input.discountPercent / 100)).toFixed(2);
    const afterDiscount = +(subtotal - discountAmount).toFixed(2);

    // Calculate tax on discounted amount
    const taxRate = input.enableGST ? 0.18 : 0;
    const tax = +(afterDiscount * taxRate).toFixed(2);
    const breakdown = input.taxMode === 'INTRA'
      ? { cgst: +(tax / 2).toFixed(2), sgst: +(tax / 2).toFixed(2), igst: 0 }
      : { cgst: 0, sgst: 0, igst: tax };
    
    const total = +(afterDiscount + tax).toFixed(2);

    // Delete existing items and create new ones
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id }
    });

    const q = await prisma.quote.update({
      where: { id },
      data: {
        clientId: input.clientId ?? null,
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        notes: input.notes ?? null,
        items: {
          create: computedItems.map((it) => ({
            organizationId: orgId,
            productName: `${it.glassType} ${it.thicknessMm}mm`,
            thicknessMm: it.thicknessMm,
            lengthFt: it.widthFt,
            widthFt: it.heightFt,
            qty: it.qty,
            unitPrice: it.unitPrice,
            processCost: it.processCost,
            areaSqFt: it.areaSqFt,
            lineTotal: it.lineTotal,
            processes: it.processes
          }))
        },
        customFields: { 
          taxBreakdown: breakdown,
          enableGST: input.enableGST,
          discountPercent: input.discountPercent,
          discountAmount
        }
      },
      include: { items: true }
    });

    return res.json(q);
  } catch (err: any) {
    console.error('Update quote failed:', err);
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'invalid_request', details: err.flatten() });
    }
    
    return res.status(500).json({ error: 'server_error' });
  }
});

export default r;
