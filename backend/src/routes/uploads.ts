import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { requireOrg } from '../middleware/org';

const prisma = new PrismaClient();
const r = Router();

const UP = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UP)) fs.mkdirSync(UP);

interface MulterFile extends Express.Multer.File {
    originalname: string;
}

interface MulterCallback {
    (error: Error | null, destination: string): void;
}

interface MulterFilenameCallback {
    (error: Error | null, filename: string): void;
}

const storage = multer.diskStorage({
    destination: (_req: Express.Request, _file: MulterFile, cb: MulterCallback) => cb(null, UP),
    filename: (_req: Express.Request, file: MulterFile, cb: MulterFilenameCallback) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
        cb(null, `${Date.now()}_${base}${ext}`);
    }
});
const upload = multer({ storage });

// serve static files
// in your server: app.use('/uploads', express.static('uploads'))

r.use(requireAuth, requireOrg);

/** Upload to a QuoteItem */
r.post('/quote-item/:itemId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const itemId = req.params.itemId;
  if (!itemId) return res.status(400).json({ error: 'itemId is required' });
  const item = await prisma.quoteItem.findUnique({ where: { id: itemId } });
  if (!item) return res.status(404).json({ error: 'quote item not found' });
  if (item.organizationId !== req.orgId) return res.status(403).json({ error: 'wrong org' });

  const url = `/uploads/${req.file.filename}`;
  const attachments = Array.isArray((item.customFields as any)?.attachments)
    ? (item.customFields as any).attachments : [];
  attachments.push({ url, caption: req.body.caption || null });

  const updated = await prisma.quoteItem.update({
    where: { id: item.id },
    data: { customFields: { ...(item.customFields as any), attachments } }
  });
  res.json({ ok: true, url, itemId: updated.id });
});

/** Upload to an OrderItem */
r.post('/order-item/:itemId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const itemId = req.params.itemId;
  if (!itemId) return res.status(400).json({ error: 'itemId is required' });
  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item) return res.status(404).json({ error: 'order item not found' });
  if (item.organizationId !== req.orgId) return res.status(403).json({ error: 'wrong org' });

  const url = `/uploads/${req.file.filename}`;
  const attachments = Array.isArray((item.customFields as any)?.attachments)
    ? (item.customFields as any).attachments : [];
  attachments.push({ url, caption: req.body.caption || null });

  const updated = await prisma.orderItem.update({
    where: { id: item.id },
    data: { customFields: { ...(item.customFields as any), attachments } }
  });
  res.json({ ok: true, url, itemId: updated.id });
});

export default r;
