// src/middleware/org.ts
import type { Request, Response, NextFunction } from 'express';

type Role = 'ADMIN' | 'STAFF' | 'VIEWER';

export function requireOrg(req: Request, res: Response, next: NextFunction) {
  // We rely on requireAuth having set req.auth
  if (!req.auth) return res.status(401).json({ error: 'auth required' });

  // org comes from header → query → JWT defaultOrgId
  const fromHeader = (req.headers['x-org-id'] as string | undefined) ?? undefined;
  const fromQuery = (req.query.orgId as string | undefined) ?? undefined;
  const fromJwt = req.auth.defaultOrgId ?? undefined;

  const orgId = fromHeader ?? fromQuery ?? fromJwt;
  if (!orgId) return res.status(400).json({ error: 'x-org-id required' });

  const match = req.auth.orgs.find(o => o.id === orgId);
  if (!match) return res.status(403).json({ error: 'not a member of this org' });

  req.orgId = orgId;
  req.role = match.role as Role;

  next();
}

/** Gate endpoints by role(s) */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role) return res.status(403).json({ error: 'no role' });
    if (!roles.includes(req.role)) return res.status(403).json({ error: 'insufficient role' });
    next();
  };
}
