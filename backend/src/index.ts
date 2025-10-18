import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import quotes from './routes/quotes';
import orders from './routes/orders';
import invoices from './routes/invoices';
import admin from './routes/admin';
import customers from './routes/customers';
import organization from './routes/organization';
import dashboard from './routes/dashboard';
import pdf from './routes/pdf';
import uploads from './routes/uploads';
import auth from './routes/auth';

import { requireAuth } from './middleware/auth';
import { requireOrg } from './middleware/org';

/** Prisma singleton (prevents many clients on hot-reload) */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ['query','info','warn','error'], // uncomment if you want SQL in console
  });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const app = express();

/** CORS — allow your Next app */
const ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
app.use(
  cors({
    origin: ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id', 'cache-control'],
    maxAge: 600,
  })
);


/** Common middleware */
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

/** Public auth routes */
app.use('/auth', auth);
app.use('/api/v1', (req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const hasAuth = !!req.headers.authorization;
    const org = req.headers['x-org-id'];
    console.log(`[dbg] ${req.method} ${req.path} auth=${hasAuth} org=${org ?? '-'}`);
  }
  next();
});

/** Protected business routes */
app.use('/api/v1/quotes', requireAuth, requireOrg, quotes);
app.use('/api/v1/orders', requireAuth, requireOrg, orders);
app.use('/api/v1/invoices', requireAuth, requireOrg, invoices);
app.use('/api/v1/admin', requireAuth, requireOrg, admin);
app.use('/api/v1/customers', requireAuth, requireOrg, customers);
app.use('/api/v1/organization', requireAuth, requireOrg, organization);
app.use('/api/v1/dashboard', requireAuth, requireOrg, dashboard);
app.use('/api/v1/uploads', requireAuth, requireOrg, uploads);

/** PDF routes — protect if you want */
app.use('/api/v1/pdf', /* requireAuth, requireOrg, */ pdf);

/** Static files */
app.use('/uploads', express.static(path.resolve('uploads')));

/** Health */
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'db_unreachable' });
  }
});

/** 404 */
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

/** Central error handler */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (!res.headersSent) res.status(500).json({ error: 'server_error' });
});

/** Start */
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`API on :${PORT}  (CORS origin: ${ORIGIN})`);
});

/** Graceful shutdown */
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
