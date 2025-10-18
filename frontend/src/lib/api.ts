// src/lib/api.ts
import ky from 'ky';

const RAW = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/';
const BASE = RAW.endsWith('/') ? RAW : RAW + '/';

export const authApi = ky.create({
  prefixUrl: BASE,
  timeout: 20000,
  hooks: { beforeRequest: [req => {
    req.headers.set('accept', 'application/json');
    req.headers.set('cache-control', 'no-store');
  }] }
});

export const apiV1 = ky.create({
  prefixUrl: BASE + 'api/v1/',
  timeout: 20000,
  retry: { limit: 2, statusCodes: [408,429,500,502,503,504] },
  hooks: {
    beforeRequest: [req => {
      if (typeof window !== 'undefined') {
        const t = localStorage.getItem('token');
        const o = localStorage.getItem('orgId');
        if (t) req.headers.set('authorization', `Bearer ${t}`);
        if (o) req.headers.set('x-org-id', o);
      }
      req.headers.set('accept', 'application/json');
      req.headers.set('cache-control', 'no-store');
      if (process.env.NODE_ENV !== 'production') {
        console.log('[apiV1] →', req.url, {
          auth: !!req.headers.get('authorization'),
          org: req.headers.get('x-org-id') || '-',
        });
      }
    }],
    afterResponse: [async (_req, _opts, res) => {
      if (typeof window === 'undefined') return;
      if (res.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('orgId'); location.href = '/login'; }
      else if (res.status === 403) { location.href = '/onboarding/create-org'; }
    }]
  }
});
// Unified API client that handles both auth and api/v1 routes
export const api = ky.create({
  prefixUrl: BASE,
  timeout: 20000,
  retry: { limit: 2, statusCodes: [408, 429, 500, 502, 503, 504] },
  hooks: {
    beforeRequest: [
      req => {
        if (typeof window !== 'undefined') {
          const t = localStorage.getItem('token');
          const o = localStorage.getItem('orgId');
          if (t) req.headers.set('authorization', `Bearer ${t}`);
          if (o) req.headers.set('x-org-id', o);
        }
        req.headers.set('accept', 'application/json');
        req.headers.set('cache-control', 'no-store');
      },
    ],
    afterResponse: [
      async (_req, _opts, res) => {
        if (typeof window === 'undefined') return;
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('orgId');
          location.href = '/login';
        } else if (res.status === 403) {
          location.href = '/onboarding/create-org';
        }
      },
    ],
  },
});