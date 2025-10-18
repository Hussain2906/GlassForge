import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { requireOrg } from '../middleware/org';

const prisma = new PrismaClient();
const r = Router();

r.use(requireAuth, requireOrg);

// Get all customers
r.get('/', async (req, res) => {
  const rows = await prisma.client.findMany({ 
    where: { organizationId: req.orgId! },
    include: {
      _count: {
        select: {
          quotes: true,
          orders: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
  res.json(rows);
});

// Get single customer
r.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }
  const row = await prisma.client.findUnique({ 
    where: { id, organizationId: req.orgId! },
    include: {
      _count: {
        select: {
          quotes: true,
          orders: true
        }
      },
      quotes: {
        orderBy: { date: 'desc' },
        take: 10
      },
      orders: {
        orderBy: { orderDate: 'desc' },
        take: 10
      }
    }
  });
  if (!row) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(row);
});

// Create customer
r.post('/', async (req, res) => {
  const { name, phone, gstNumber, billingAddress, shippingAddress, customFields } = req.body;
  const row = await prisma.client.create({ 
    data: { 
      organizationId: req.orgId!, 
      name, 
      phone, 
      gstNumber, 
      billingAddress, 
      shippingAddress, 
      customFields 
    } 
  });
  res.json(row);
});

// Update customer
r.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }
  // Verify the customer belongs to the organization
  const existing = await prisma.client.findUnique({ 
    where: { id, organizationId: req.orgId! } 
  });
  if (!existing) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const row = await prisma.client.update({ 
    where: { id }, 
    data: req.body 
  });
  res.json(row);
});

// Delete customer
r.delete('/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }
  // Verify the customer belongs to the organization
  const existing = await prisma.client.findUnique({ 
    where: { id, organizationId: req.orgId! } 
  });
  if (!existing) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  await prisma.client.delete({ where: { id } });
  res.json({ ok: true });
});

export default r;