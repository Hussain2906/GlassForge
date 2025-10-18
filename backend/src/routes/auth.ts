// src/routes/auth.ts
import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { initializeOrganizationDefaults } from '../services/organization';
import { generateUniqueOrgSlug } from '../utils/slug';

const prisma = new PrismaClient();
const r = Router();

/** ---- Helpers ---- */

type Claim = { id: string; role: Role; name?: string };

async function getUserClaims(userId: string) {
  const orgUsers = await prisma.organizationUser.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { id: 'asc' },
  });
  const claims: Claim[] = orgUsers.map(ou => ({
    id: ou.organizationId,
    role: ou.role,
    name: ou.organization.name,
  }));
  const defaultOrgId = claims[0]?.id;
  return { claims, defaultOrgId };
}

async function issueToken(userId: string, explicitDefaultOrgId?: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { claims, defaultOrgId } = await getUserClaims(userId);
  const token = signToken({
    userId: user.id,
    email: user.email,
    orgs: claims.map(c => ({ id: c.id, role: c.role })), // minimal claims inside JWT
    ...(explicitDefaultOrgId
      ? { defaultOrgId: explicitDefaultOrgId }
      : defaultOrgId
        ? { defaultOrgId }
        : {}),
  });
  return { token, defaultOrgId: explicitDefaultOrgId ?? defaultOrgId, orgs: claims };
}

function zodError(res: any, e: unknown) {
  if (e instanceof z.ZodError) {
    console.error('Validation error:', e.flatten());
    const firstError = e.issues[0];
    const errorMessage = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Invalid request data';
    return res.status(400).json({ 
      error: errorMessage,
      details: e.flatten() 
    });
  }
  return null;
}

/** ---- Routes ---- */

/** POST /auth/register
 * Register a user account (no org yet).
 * Body: { email, password, displayName? }
 */
r.post('/register', async (req, res) => {
  try {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      displayName: z.string().min(1).optional(),
    }).parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'email already registered' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const displayName = (body.displayName || body.email.split('@')[0]) as string;

    const user = await prisma.user.create({
      data: { email: body.email, passwordHash, displayName },
    });

    const { token, defaultOrgId, orgs } = await issueToken(user.id);
    return res.json({ token, defaultOrgId, orgs });
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('POST /auth/register', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** POST /auth/register-owner
 * Create user + organization in one go (owner).
 * Body: { user: { email, password, displayName }, organization: { name, ... } }
 */
r.post('/register-owner', async (req, res) => {
  try {
    const body = z.object({
      user: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        displayName: z.string().min(1),
      }),
      organization: z.object({
        name: z.string().min(2),
        companyType: z.string().optional().nullable(),
        industry: z.string().optional().nullable(),
        foundedYear: z.number().optional().nullable(),
        employeeCount: z.string().optional().nullable(),
        annualRevenue: z.string().optional().nullable(),
        email: z.string().optional().refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
          message: "Invalid email format"
        }),
        phone: z.string().optional().nullable(),
        website: z.string().optional().refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
          message: "Invalid URL format"
        }),
        address: z.object({
          street: z.string().optional().nullable(),
          city: z.string().optional().nullable(),
          state: z.string().optional().nullable(),
          country: z.string().optional().nullable(),
          pincode: z.string().optional().nullable(),
        }).optional().nullable(),
        registrationNumber: z.string().optional().nullable(),
        gstNumber: z.string().optional().nullable(),
        panNumber: z.string().optional().nullable(),
        cinNumber: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        timeZone: z.string().optional().nullable(),
        currency: z.string().optional().nullable(),
      }),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.user.email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(body.user.password, 10);

    // Create org first with comprehensive data
    const slug = await generateUniqueOrgSlug(body.organization.name);
    
    // Prepare organization data, filtering out undefined values
    const orgData: any = {
      name: body.organization.name,
      slug,
      settings: {},
      timeZone: body.organization.timeZone || 'Asia/Kolkata',
      currency: body.organization.currency || 'INR',
      maxUsers: 2, // Default limit
    };

    // Add optional fields only if they have values (not empty strings)
    if (body.organization.companyType && body.organization.companyType.trim()) {
      orgData.companyType = body.organization.companyType;
    }
    if (body.organization.industry && body.organization.industry.trim()) {
      orgData.industry = body.organization.industry;
    }
    if (body.organization.foundedYear) {
      orgData.foundedYear = body.organization.foundedYear;
    }
    if (body.organization.employeeCount && body.organization.employeeCount.trim()) {
      orgData.employeeCount = body.organization.employeeCount;
    }
    if (body.organization.annualRevenue && body.organization.annualRevenue.trim()) {
      orgData.annualRevenue = body.organization.annualRevenue;
    }
    if (body.organization.email && body.organization.email.trim() && body.organization.email !== '') {
      orgData.email = body.organization.email;
    }
    if (body.organization.phone && body.organization.phone.trim() && body.organization.phone !== '') {
      orgData.phone = body.organization.phone;
    }
    if (body.organization.website && body.organization.website.trim() && body.organization.website !== '') {
      orgData.website = body.organization.website;
    }
    if (body.organization.address && Object.values(body.organization.address).some(v => v && v.trim())) {
      orgData.address = body.organization.address;
    }
    if (body.organization.registrationNumber && body.organization.registrationNumber.trim()) {
      orgData.registrationNumber = body.organization.registrationNumber;
    }
    if (body.organization.gstNumber && body.organization.gstNumber.trim()) {
      orgData.gstNumber = body.organization.gstNumber;
    }
    if (body.organization.panNumber && body.organization.panNumber.trim()) {
      orgData.panNumber = body.organization.panNumber;
    }
    if (body.organization.cinNumber && body.organization.cinNumber.trim()) {
      orgData.cinNumber = body.organization.cinNumber;
    }
    if (body.organization.description && body.organization.description.trim()) {
      orgData.description = body.organization.description;
    }

    const org = await prisma.organization.create({
      data: orgData,
    });

    await initializeOrganizationDefaults(org.id);

    // Create user and link as ADMIN
    const user = await prisma.user.create({
      data: {
        email: body.user.email,
        passwordHash,
        displayName: body.user.displayName,
        orgUsers: {
          create: {
            organizationId: org.id,
            role: Role.ADMIN,
          },
        },
      },
    });

    const { token, defaultOrgId, orgs } = await issueToken(user.id, org.id);
    return res.json({ 
      token, 
      defaultOrgId, 
      orgs,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      }
    });
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('POST /auth/register-owner error:', e);
    
    // Check for specific database errors
    if (e instanceof Error) {
      if (e.message.includes('Unique constraint')) {
        return res.status(409).json({ error: 'Organization name or email already exists' });
      }
      if (e.message.includes('Foreign key constraint')) {
        return res.status(400).json({ error: 'Invalid data provided' });
      }
    }
    
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/** POST /auth/login
 * Body: { email, password }
 * Returns token + orgs + defaultOrgId (if any)
 */
r.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid creds' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid creds' });

    const { token, defaultOrgId, orgs } = await issueToken(user.id);
    return res.json({ token, defaultOrgId, orgs });
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('POST /auth/login', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** GET /auth/me */
r.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const { token, defaultOrgId, orgs } = await issueToken(req.auth!.userId, req.auth!.defaultOrgId);
    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      orgs,
      defaultOrgId,
      token,
    });
  } catch (e) {
    console.error('GET /auth/me', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** POST /auth/orgs
 * Create a NEW org for the logged-in user (becomes ADMIN).
 * Body: { name: string }
 */
r.post('/orgs', requireAuth, async (req, res) => {
  try {
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body);

    const slug = await generateUniqueOrgSlug(name);
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        settings: {},
      },
    });

    await initializeOrganizationDefaults(org.id);

    await prisma.organizationUser.create({
      data: {
        organizationId: org.id,
        userId: req.auth!.userId,
        role: Role.ADMIN, // ✅ enum
      },
    });

    const { token, defaultOrgId, orgs } = await issueToken(req.auth!.userId, org.id);
    return res.json({ organization: org, token, defaultOrgId, orgs });
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('POST /auth/orgs', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** POST /auth/switch-org
 * Body: { orgId }
 * Re-issue token with different defaultOrgId (must be a member).
 */
r.post('/switch-org', requireAuth, async (req, res) => {
  try {
    const { orgId } = z.object({ orgId: z.string().min(1) }).parse(req.body);

    const member = await prisma.organizationUser.findFirst({
      where: { userId: req.auth!.userId, organizationId: orgId },
    });
    if (!member) return res.status(403).json({ error: 'not a member of this org' });

    const { token, orgs } = await issueToken(req.auth!.userId, orgId);
    return res.json({ token, defaultOrgId: orgId, orgs });
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('POST /auth/switch-org', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

/** PUT /auth/profile
 * Update user profile
 * Body: { displayName, phone?, location? }
 */
r.put('/profile', requireAuth, async (req, res) => {
  try {
    const { displayName, phone, location } = z.object({
      displayName: z.string().min(1),
      phone: z.string().optional(),
      location: z.string().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        displayName,
        // Note: phone and location would need to be added to User model
        // For now, we'll just update displayName
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    res.json(user);
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('PUT /auth/profile', e);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/** PUT /auth/change-password
 * Change user password
 * Body: { currentPassword, newPassword }
 */
r.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ 
      where: { id: req.auth!.userId } 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: req.auth!.userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (e) {
    if (zodError(res, e)) return;
    console.error('PUT /auth/change-password', e);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

export default r;
