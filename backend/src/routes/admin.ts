import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { requireOrg, requireRole } from '../middleware/org';

const prisma = new PrismaClient();
const r = Router();

r.use(requireAuth, requireOrg);

// --------- ORGANIZATION SETTINGS ----------
r.get('/organization', requireRole('ADMIN'), async (req, res) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.orgId! },
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Format the response for frontend compatibility
    const formattedOrg = {
      id: organization.id,
      name: organization.name,
      email: (organization as any).email || 'admin@organization.com',
      phone: (organization as any).phone || '',
      address: (organization as any).address || '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      maxUsers: (organization as any).maxUsers || 2,
      currentPlan: 'Free',
      createdAt: (organization as any).createdAt || new Date()
    };

    res.json(formattedOrg);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

r.put('/organization', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, phone, address, maxUsers } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (maxUsers) updateData.maxUsers = Number(maxUsers);

    const updatedOrganization = await prisma.organization.update({
      where: { id: req.orgId! },
      data: updateData,
    });

    // Format the response for frontend compatibility
    const formattedOrg = {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      email: (updatedOrganization as any).email || 'admin@organization.com',
      phone: (updatedOrganization as any).phone || '',
      address: (updatedOrganization as any).address || '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      maxUsers: (updatedOrganization as any).maxUsers || 2,
      currentPlan: 'Free',
      createdAt: (updatedOrganization as any).createdAt || new Date()
    };

    res.json(formattedOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Billing endpoints
r.get('/billing', requireRole('ADMIN'), async (req, res) => {
  try {
    // Mock billing data - in production, this would integrate with Stripe/payment provider
    const billingData = {
      currentPlan: {
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
          'Up to 5 users',
          '1GB storage',
          '1,000 API calls/month',
          'Basic support'
        ]
      },
      usage: {
        users: 2,
        storage: 0.5,
        apiCalls: 150
      },
      limits: {
        users: 5,
        storage: 1,
        apiCalls: 1000
      },
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: null,
      invoices: []
    };

    res.json(billingData);
  } catch (error) {
    console.error('Error fetching billing data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

r.post('/billing/upgrade', requireRole('ADMIN'), async (req, res) => {
  try {
    const { plan } = req.body;

    // Mock upgrade process - in production, this would create Stripe checkout session
    const checkoutUrl = `https://checkout.stripe.com/pay/mock-${plan}`;

    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Error initiating upgrade:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Security settings
r.get('/security', requireRole('ADMIN'), async (req, res) => {
  try {
    // Mock security settings - in production, store in database
    const securitySettings = {
      twoFactorAuth: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true,
      },
      sessionTimeout: 30,
      ipWhitelist: '',
      auditLogging: true,
      loginNotifications: true,
    };

    res.json(securitySettings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

r.put('/security', requireRole('ADMIN'), async (req, res) => {
  try {
    // Mock security settings update - in production, store in database
    const updatedSettings = req.body;

    res.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --------- CUSTOMERS ----------
r.get('/customers', async (req, res) => {
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

r.get('/customers/:id', async (req, res) => {
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
      }
    }
  });
  if (!row) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(row);
});

r.post('/customers', async (req, res) => {
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

r.patch('/customers/:id', async (req, res) => {
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

r.delete('/customers/:id', async (req, res) => {
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

// --------- PRODUCTS ----------
r.get('/products', async (req, res) => {
  const rows = await prisma.product.findMany({ where: { organizationId: req.orgId! } });
  res.json(rows);
});
r.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  const row = await prisma.product.findUnique({
    where: { id, organizationId: req.orgId! }
  });
  if (!row) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(row);
});
r.post('/products', requireRole('ADMIN'), async (req, res) => {
  const { name, thicknessMm, unitPrice, attributes, notes } = req.body;
  const row = await prisma.product.create({ data: { organizationId: req.orgId!, name, thicknessMm, unitPrice, attributes, notes } });
  res.json(row);
});
r.put('/products/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  const row = await prisma.product.update({ where: { id }, data: req.body });
  res.json(row);
});
r.patch('/products/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  // Verify the product belongs to the organization
  const existing = await prisma.product.findUnique({
    where: { id, organizationId: req.orgId! }
  });
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const row = await prisma.product.update({
    where: { id },
    data: req.body
  });
  res.json(row);
});
r.delete('/products/:id', requireRole('ADMIN'), async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  await prisma.product.delete({ where: { id } });
  res.json({ ok: true });
});

// --------- PROCESSES ----------
r.get('/processes', async (req, res) => {
  const rows = await prisma.processDefinition.findMany({ where: { organizationId: req.orgId! } });
  res.json(rows);
});
r.post('/processes', requireRole('ADMIN'), async (req, res) => {
  const { name, priceRule, rate, unit, attributes, notes } = req.body;
  const row = await prisma.processDefinition.create({ data: { organizationId: req.orgId!, name, priceRule, rate, unit, attributes, notes } });
  res.json(row);
});
r.put('/processes/:id', requireRole('ADMIN'), async (req, res) => {
  const row = await prisma.processDefinition.update({ where: { id: req.params.id! }, data: req.body });
  res.json(row);
});
r.delete('/processes/:id', requireRole('ADMIN'), async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  await prisma.processDefinition.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// --------- TAXES ----------
r.get('/taxes', async (req, res) => {
  const rows = await prisma.taxRate.findMany({ where: { organizationId: req.orgId! } });
  res.json(rows);
});
r.post('/taxes', requireRole('ADMIN'), async (req, res) => {
  const { name, rate, scope } = req.body;
  const row = await prisma.taxRate.create({ data: { organizationId: req.orgId!, name, rate, scope } });
  res.json(row);
});
r.put('/taxes/:id', requireRole('ADMIN'), async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'Tax ID is required' });
  }
  const row = await prisma.taxRate.update({ where: { id: req.params.id }, data: req.body });
  res.json(row);
});
r.delete('/taxes/:id', requireRole('ADMIN'), async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Tax ID is required' });
  }
  await prisma.taxRate.delete({ where: { id } });
  res.json({ ok: true });
});

// --------- USERS & ROLES ----------
r.get('/users', requireRole('ADMIN'), async (req, res) => {
  const rows = await prisma.organizationUser.findMany({
    where: { organizationId: req.orgId! },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true
        }
      }
    },
    orderBy: { user: { displayName: 'asc' } }
  });

  // Check if this is for the settings page (flattened format)
  if (req.query.format === 'settings') {
    const formattedUsers = rows.map(row => ({
      id: row.id,
      name: row.user?.displayName || row.user?.email || 'Unknown User',
      email: row.user?.email || '',
      role: row.role,
      status: 'ACTIVE', // Default status
      lastActive: row.user?.createdAt || new Date()
    }));
    return res.json(formattedUsers);
  }

  // Return original structure for admin users page with safety checks
  const safeRows = rows.filter(row => row.user).map(row => {
    if (!row.user) {
      console.warn('Found organizationUser without user:', row.id);
      return null;
    }
    return {
      ...row,
      user: {
        id: row.user.id || '',
        email: row.user.email || '',
        displayName: row.user.displayName || row.user.email || 'Unknown User'
      }
    };
  }).filter(Boolean);

  console.log(`Returning ${safeRows.length} users for admin users page`);
  res.json(safeRows);
});

// User invitation endpoint for settings page
r.post('/users/invite', requireRole('ADMIN'), async (req, res) => {
  const { email, name, role = 'STAFF' } = req.body;

  try {
    // Check organization user limit
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId! },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const maxUsers = (org as any).maxUsers || 2;
    if (org._count.users >= maxUsers) {
      return res.status(400).json({
        message: `Maximum user limit reached. This organization can have up to ${maxUsers} users.`
      });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          displayName: name,
          passwordHash
        }
      });
    }

    // Check if user is already in this organization
    const existingOrgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: req.orgId!,
          userId: user.id
        }
      }
    });

    if (existingOrgUser) {
      return res.status(400).json({ message: 'User is already a member of this organization' });
    }

    // Add user to organization
    const orgUser = await prisma.organizationUser.create({
      data: {
        organizationId: req.orgId!,
        userId: user.id,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    res.json({ message: 'User invited successfully', user: orgUser });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Failed to invite user' });
  }
});

// Update user role
r.put('/users/:id/role', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // First check if the organization user exists
    const existingOrgUser = await prisma.organizationUser.findFirst({
      where: {
        id: id,
        organizationId: req.orgId!
      }
    });

    if (!existingOrgUser) {
      return res.status(404).json({ message: 'User not found in this organization' });
    }

    const updated = await prisma.organizationUser.update({
      where: { id: id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Deactivate user
r.put('/users/:id/deactivate', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // First check if the organization user exists
    const existingOrgUser = await prisma.organizationUser.findFirst({
      where: {
        id: id,
        organizationId: req.orgId!
      }
    });

    if (!existingOrgUser) {
      return res.status(404).json({ message: 'User not found in this organization' });
    }

    // In a real implementation, you might set a status field instead of deleting
    await prisma.organizationUser.delete({
      where: { id: id }
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
});

r.post('/users', requireRole('ADMIN'), async (req, res) => {
  const { email, displayName, role = 'STAFF' } = req.body;

  try {
    // Check organization user limit
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId! },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const maxUsers = (org as any).maxUsers || 2; // Default to 2 if not found
    if (org._count.users >= maxUsers) {
      return res.status(400).json({
        error: `Maximum user limit reached. This organization can have up to ${maxUsers} users.`
      });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user with temporary password (they'll need to reset)
      const tempPassword = Math.random().toString(36).slice(-8);
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          displayName,
          passwordHash
        }
      });
    }

    // Check if user is already in this organization
    const existingOrgUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: req.orgId!,
          userId: user.id
        }
      }
    });

    if (existingOrgUser) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Add user to organization
    const orgUser = await prisma.organizationUser.create({
      data: {
        organizationId: req.orgId!,
        userId: user.id,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    res.json(orgUser);
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

r.patch('/users/:id', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Verify the organization user exists and belongs to this org
  const existing = await prisma.organizationUser.findUnique({
    where: { id, organizationId: req.orgId! }
  });

  if (!existing) {
    return res.status(404).json({ error: 'User not found in this organization' });
  }

  const updated = await prisma.organizationUser.update({
    where: { id },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true
        }
      }
    }
  });

  res.json(updated);
});

r.delete('/users/:id', requireRole('ADMIN'), async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Verify the organization user exists and belongs to this org
  const existing = await prisma.organizationUser.findUnique({
    where: { id, organizationId: req.orgId! }
  });

  if (!existing) {
    return res.status(404).json({ error: 'User not found in this organization' });
  }

  await prisma.organizationUser.delete({ where: { id } });
  res.json({ ok: true });
});

// --------- SEQUENCE REPAIR ----------
r.post('/repair-sequences', requireRole('ADMIN'), async (req, res) => {
  try {
    const { repairAllSequences } = await import('../services/sequence-repair');
    const results = await repairAllSequences(req.orgId!);
    res.json({ message: 'Sequence repair completed', results });
  } catch (error) {
    console.error('Error repairing sequences:', error);
    res.status(500).json({ message: 'Failed to repair sequences' });
  }
});

export default r;
