'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/loading-spinner';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(pathname);

  useEffect(() => {
    if (pathname !== displayLocation) {
      setLoading(true);
      
      // Simulate page transition delay
      const timer = setTimeout(() => {
        setDisplayLocation(pathname);
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, displayLocation]);

  if (loading) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}