'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PREFIXES = ['/login', '/register', '/register-owner'];
const ONBOARD_PREFIX = '/onboarding/create-org';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Public pages: no checks
    if (PUBLIC_PREFIXES.some(p => pathname?.startsWith(p))) {
      setReady(true);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('orgId') : null;

    // Onboarding requires token but org is optional
    if (pathname?.startsWith(ONBOARD_PREFIX)) {
      if (!token) router.replace('/login');
      else setReady(true);
      return;
    }

    // App pages: require token; some routes also need orgId (e.g. quotes list)
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  return <>{children}</>;
}
