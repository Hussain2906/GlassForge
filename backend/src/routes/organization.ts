import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { requireOrg } from '../middleware/org';

const prisma = new PrismaClient();
const r = Router();

r.use(requireAuth, requireOrg);

// Get organization profile
r.get('/profile', async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId! },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            products: true,
            quotes: true,
            orders: true,
          }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(org);
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    res.status(500).json({ error: 'Failed to fetch organization profile' });
  }
});

// Update organization profile
r.patch('/profile', async (req, res) => {
  try {
    const {
      name,
      companyType,
      industry,
      foundedYear,
      employeeCount,
      annualRevenue,
      email,
      phone,
      website,
      address,
      registrationNumber,
      gstNumber,
      panNumber,
      cinNumber,
      description,
      timeZone,
      currency,
    } = req.body;

    const org = await prisma.organization.update({
      where: { id: req.orgId! },
      data: {
        name,
        companyType,
        industry,
        foundedYear,
        employeeCount,
        annualRevenue,
        email,
        phone,
        website,
        address,
        registrationNumber,
        gstNumber,
        panNumber,
        cinNumber,
        description,
        timeZone,
        currency,
      },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            products: true,
            quotes: true,
            orders: true,
          }
        }
      }
    });

    res.json(org);
  } catch (error) {
    console.error('Error updating organization profile:', error);
    res.status(500).json({ error: 'Failed to update organization profile' });
  }
});

export default r;