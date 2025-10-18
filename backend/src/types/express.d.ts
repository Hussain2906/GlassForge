import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string;
      email: string;
      orgs: Array<{ id: string; role: 'ADMIN' | 'STAFF' | 'VIEWER' }>;
      defaultOrgId?: string;
    };
    orgId?: string;
    role?: 'ADMIN' | 'STAFF' | 'VIEWER';
  }
}