import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireOrg, requireRole } from '../middleware/org';

const prisma = new PrismaClient();
const r = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GlassRateSchema = z.object({
  glassType: z.string().min(1, 'Glass type is required'),
  rate_3_5mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_4mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_5mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_6mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_8mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_10mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_12mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_19mm: z.coerce.number().nonnegative().optional().nullable(),
  rate_dgu: z.coerce.number().nonnegative().optional().nullable(),
  customRates: z.record(z.string(), z.number().nonnegative()).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/admin/glass-rates
 * List all glass rates for organization
 */
r.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const where: any = {
      organizationId: req.orgId!
    };

    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const glassRates = await prisma.glassRate.findMany({
      where,
      orderBy: { glassType: 'asc' }
    });

    res.json(glassRates);
  } catch (error) {
    console.error('Error fetching glass rates:', error);
    res.status(500).json({ error: 'Failed to fetch glass rates' });
  }
});

/**
 * GET /api/v1/admin/glass-rates/:id
 * Get single glass rate by ID
 */
r.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const glassRate = await prisma.glassRate.findFirst({
      where: {
        id,
        organizationId: req.orgId!
      }
    });

    if (!glassRate) {
      return res.status(404).json({ error: 'Glass rate not found' });
    }

    res.json(glassRate);
  } catch (error) {
    console.error('Error fetching glass rate:', error);
    res.status(500).json({ error: 'Failed to fetch glass rate' });
  }
});

/**
 * POST /api/v1/admin/glass-rates
 * Create new glass rate
 */
r.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const data = GlassRateSchema.parse(req.body);

    // Check if glass type already exists for this organization
    const existing = await prisma.glassRate.findUnique({
      where: {
        organizationId_glassType: {
          organizationId: req.orgId!,
          glassType: data.glassType
        }
      }
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'Glass type already exists',
        message: `A glass rate for "${data.glassType}" already exists in your organization`
      });
    }

    // Create glass rate
    const glassRate = await prisma.glassRate.create({
      data: {
        organizationId: req.orgId!,
        glassType: data.glassType,
        rate_3_5mm: data.rate_3_5mm ? new Prisma.Decimal(data.rate_3_5mm) : null,
        rate_4mm: data.rate_4mm ? new Prisma.Decimal(data.rate_4mm) : null,
        rate_5mm: data.rate_5mm ? new Prisma.Decimal(data.rate_5mm) : null,
        rate_6mm: data.rate_6mm ? new Prisma.Decimal(data.rate_6mm) : null,
        rate_8mm: data.rate_8mm ? new Prisma.Decimal(data.rate_8mm) : null,
        rate_10mm: data.rate_10mm ? new Prisma.Decimal(data.rate_10mm) : null,
        rate_12mm: data.rate_12mm ? new Prisma.Decimal(data.rate_12mm) : null,
        rate_19mm: data.rate_19mm ? new Prisma.Decimal(data.rate_19mm) : null,
        rate_dgu: data.rate_dgu ? new Prisma.Decimal(data.rate_dgu) : null,
        ...(data.customRates ? { customRates: data.customRates } : {}),
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    res.json(glassRate);
  } catch (error: any) {
    console.error('Error creating glass rate:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.flatten() 
      });
    }

    res.status(500).json({ error: 'Failed to create glass rate' });
  }
});

/**
 * PUT /api/v1/admin/glass-rates/:id
 * Update glass rate
 */
r.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = GlassRateSchema.partial().parse(req.body);

    // Verify ownership
    const existing = await prisma.glassRate.findFirst({
      where: {
        id: id!,
        organizationId: req.orgId!
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Glass rate not found' });
    }

    // If changing glass type, check for duplicates
    if (data.glassType && data.glassType !== existing.glassType) {
      const duplicate = await prisma.glassRate.findUnique({
        where: {
          organizationId_glassType: {
            organizationId: req.orgId!,
            glassType: data.glassType
          }
        }
      });

      if (duplicate) {
        return res.status(400).json({ 
          error: 'Glass type already exists',
          message: `A glass rate for "${data.glassType}" already exists in your organization`
        });
      }
    }

    // Update glass rate
    const updateData: any = {};
    if (data.glassType) updateData.glassType = data.glassType;
    if (data.rate_3_5mm !== undefined) updateData.rate_3_5mm = data.rate_3_5mm ? new Prisma.Decimal(data.rate_3_5mm) : null;
    if (data.rate_4mm !== undefined) updateData.rate_4mm = data.rate_4mm ? new Prisma.Decimal(data.rate_4mm) : null;
    if (data.rate_5mm !== undefined) updateData.rate_5mm = data.rate_5mm ? new Prisma.Decimal(data.rate_5mm) : null;
    if (data.rate_6mm !== undefined) updateData.rate_6mm = data.rate_6mm ? new Prisma.Decimal(data.rate_6mm) : null;
    if (data.rate_8mm !== undefined) updateData.rate_8mm = data.rate_8mm ? new Prisma.Decimal(data.rate_8mm) : null;
    if (data.rate_10mm !== undefined) updateData.rate_10mm = data.rate_10mm ? new Prisma.Decimal(data.rate_10mm) : null;
    if (data.rate_12mm !== undefined) updateData.rate_12mm = data.rate_12mm ? new Prisma.Decimal(data.rate_12mm) : null;
    if (data.rate_19mm !== undefined) updateData.rate_19mm = data.rate_19mm ? new Prisma.Decimal(data.rate_19mm) : null;
    if (data.rate_dgu !== undefined) updateData.rate_dgu = data.rate_dgu ? new Prisma.Decimal(data.rate_dgu) : null;
    if (data.customRates !== undefined) updateData.customRates = data.customRates;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const glassRate = await prisma.glassRate.update({
      where: { id: id! },
      data: updateData
    });

    res.json(glassRate);
  } catch (error: any) {
    console.error('Error updating glass rate:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.flatten() 
      });
    }

    res.status(500).json({ error: 'Failed to update glass rate' });
  }
});

/**
 * DELETE /api/v1/admin/glass-rates/:id
 * Delete glass rate
 */
r.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.glassRate.findFirst({
      where: {
        id: id!,
        organizationId: req.orgId!
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Glass rate not found' });
    }

    // Delete glass rate
    await prisma.glassRate.delete({
      where: { id: id! }
    });

    res.json({ success: true, message: 'Glass rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting glass rate:', error);
    res.status(500).json({ error: 'Failed to delete glass rate' });
  }
});

export default r;
