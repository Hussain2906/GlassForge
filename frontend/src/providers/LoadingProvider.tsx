'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FullPageLoader } from '@/components/ui/loading-spinner';

interface LoadingContextType {
  isLoading: (key?: string) => boolean;
  setLoading: (loading: boolean, key?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, key?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return globalLoading || Object.values(loadingStates).some(Boolean);
  }, [loadingStates, globalLoading]);

  const setLoading = useCallback((loading: boolean, key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: loading }));
    } else {
      setGlobalLoading(loading);
    }
  }, []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>, key?: string): Promise<T> => {
    setLoading(true, key);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false, key);
    }
  }, [setLoading]);

  const contextValue: LoadingContextType = {
    isLoading,
    setLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {globalLoading && <FullPageLoader />}
    </LoadingContext.Provider>
  );
}