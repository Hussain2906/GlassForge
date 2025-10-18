'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="p-6 text-sm text-gray-500">
      Redirecting to dashboard...
    </div>
  );
}