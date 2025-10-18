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

const ProcessMasterSchema = z.object({
  processCode: z.string().min(1, 'Process code is required'),
  name: z.string().min(1, 'Process name is required'),
  pricingType: z.enum(['F', 'A', 'L'], {
    message: 'Pricing type must be F (Fixed), A (Area), or L (Length)'
  }),
  rateT: z.coerce.number().nonnegative().optional().nullable(),
  rateA: z.coerce.number().nonnegative().optional().nullable(),
  rateL: z.coerce.number().nonnegative().optional().nullable(),
  rateF: z.coerce.number().nonnegative().optional().nullable(),
  rateS: z.coerce.number().nonnegative().optional().nullable(),
  rateW: z.coerce.number().nonnegative().optional().nullable(),
  rateY: z.coerce.number().nonnegative().optional().nullable(),
  rateZ: z.coerce.number().nonnegative().optional().nullable(),
  rateCOL: z.coerce.number().nonnegative().optional().nullable(),
  remarks: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/v1/admin/process-master
 * List all process definitions for organization
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

    const processes = await prisma.processMaster.findMany({
      where,
      orderBy: { processCode: 'asc' }
    });

    res.json(processes);
  } catch (error) {
    console.error('Error fetching process masters:', error);
    res.status(500).json({ error: 'Failed to fetch process masters' });
  }
});

/**
 * GET /api/v1/admin/process-master/:id
 * Get single process master by ID
 */
r.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const process = await prisma.processMaster.findFirst({
      where: {
        id,
        organizationId: req.orgId!
      }
    });

    if (!process) {
      return res.status(404).json({ error: 'Process master not found' });
    }

    res.json(process);
  } catch (error) {
    console.error('Error fetching process master:', error);
    res.status(500).json({ error: 'Failed to fetch process master' });
  }
});

/**
 * POST /api/v1/admin/process-master
 * Create new process master
 */
r.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const data = ProcessMasterSchema.parse(req.body);

    // Check if process code already exists for this organization
    const existing = await prisma.processMaster.findUnique({
      where: {
        organizationId_processCode: {
          organizationId: req.orgId!,
          processCode: data.processCode
        }
      }
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'Process code already exists',
        message: `A process with code "${data.processCode}" already exists in your organization`
      });
    }

    // Create process master
    const process = await prisma.processMaster.create({
      data: {
        organizationId: req.orgId!,
        processCode: data.processCode,
        name: data.name,
        pricingType: data.pricingType,
        rateT: data.rateT ? new Prisma.Decimal(data.rateT) : null,
        rateA: data.rateA ? new Prisma.Decimal(data.rateA) : null,
        rateL: data.rateL ? new Prisma.Decimal(data.rateL) : null,
        rateF: data.rateF ? new Prisma.Decimal(data.rateF) : null,
        rateS: data.rateS ? new Prisma.Decimal(data.rateS) : null,
        rateW: data.rateW ? new Prisma.Decimal(data.rateW) : null,
        rateY: data.rateY ? new Prisma.Decimal(data.rateY) : null,
        rateZ: data.rateZ ? new Prisma.Decimal(data.rateZ) : null,
        rateCOL: data.rateCOL ? new Prisma.Decimal(data.rateCOL) : null,
        remarks: data.remarks || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    res.json(process);
  } catch (error: any) {
    console.error('Error creating process master:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.flatten() 
      });
    }

    res.status(500).json({ error: 'Failed to create process master' });
  }
});

/**
 * PUT /api/v1/admin/process-master/:id
 * Update process master
 */
r.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = ProcessMasterSchema.partial().parse(req.body);

    // Verify ownership
    const existing = await prisma.processMaster.findFirst({
      where: {
        id: id!,
        organizationId: req.orgId!
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Process master not found' });
    }

    // If changing process code, check for duplicates
    if (data.processCode && data.processCode !== existing.processCode) {
      const duplicate = await prisma.processMaster.findUnique({
        where: {
          organizationId_processCode: {
            organizationId: req.orgId!,
            processCode: data.processCode
          }
        }
      });

      if (duplicate) {
        return res.status(400).json({ 
          error: 'Process code already exists',
          message: `A process with code "${data.processCode}" already exists in your organization`
        });
      }
    }

    // Update process master
    const updateData: any = {};
    if (data.processCode) updateData.processCode = data.processCode;
    if (data.name) updateData.name = data.name;
    if (data.pricingType) updateData.pricingType = data.pricingType;
    if (data.rateT !== undefined) updateData.rateT = data.rateT ? new Prisma.Decimal(data.rateT) : null;
    if (data.rateA !== undefined) updateData.rateA = data.rateA ? new Prisma.Decimal(data.rateA) : null;
    if (data.rateL !== undefined) updateData.rateL = data.rateL ? new Prisma.Decimal(data.rateL) : null;
    if (data.rateF !== undefined) updateData.rateF = data.rateF ? new Prisma.Decimal(data.rateF) : null;
    if (data.rateS !== undefined) updateData.rateS = data.rateS ? new Prisma.Decimal(data.rateS) : null;
    if (data.rateW !== undefined) updateData.rateW = data.rateW ? new Prisma.Decimal(data.rateW) : null;
    if (data.rateY !== undefined) updateData.rateY = data.rateY ? new Prisma.Decimal(data.rateY) : null;
    if (data.rateZ !== undefined) updateData.rateZ = data.rateZ ? new Prisma.Decimal(data.rateZ) : null;
    if (data.rateCOL !== undefined) updateData.rateCOL = data.rateCOL ? new Prisma.Decimal(data.rateCOL) : null;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const process = await prisma.processMaster.update({
      where: { id: id! },
      data: updateData
    });

    res.json(process);
  } catch (error: any) {
    console.error('Error updating process master:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.flatten() 
      });
    }

    res.status(500).json({ error: 'Failed to update process master' });
  }
});

/**
 * DELETE /api/v1/admin/process-master/:id
 * Delete process master
 */
r.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.processMaster.findFirst({
      where: {
        id: id!,
        organizationId: req.orgId!
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Process master not found' });
    }

    // Delete process master
    await prisma.processMaster.delete({
      where: { id: id! }
    });

    res.json({ success: true, message: 'Process master deleted successfully' });
  } catch (error) {
    console.error('Error deleting process master:', error);
    res.status(500).json({ error: 'Failed to delete process master' });
  }
});

export default r;
