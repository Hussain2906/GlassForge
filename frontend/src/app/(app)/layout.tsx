'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/loading-spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      console.log('App layout checking token:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
      } else {
        console.log('Token found, showing app');
        setReady(true);
      }
    };
    
    // Small delay to ensure localStorage is available
    setTimeout(checkAuth, 50);
  }, [router]);
  
  if (!ready) {
    return <FullPageLoader />;
  }
  
  return <>{children}</>;
}
