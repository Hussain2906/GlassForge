// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.headers['authorization'];
    if (!raw) return res.status(401).json({ error: 'auth_header_missing' });

    const header = Array.isArray(raw) ? raw[0] : raw;
    const m = /^Bearer\s+(.+)$/.exec(header);
    if (!m || !m[1]) return res.status(401).json({ error: 'token_malformed' });

    const token = m[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'token_invalid' });
    }

    // attach for downstream
    (req as any).auth = payload;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth] ok user=', payload.userId, 'orgs=', payload.orgs?.length ?? 0);
    }
    return next();
  } catch (e: any) {
    console.error('[auth] verify failed:', e?.message);
    return res.status(401).json({ error: 'token_invalid' });
  }
}
