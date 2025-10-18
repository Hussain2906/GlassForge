import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useLoading(initialState = false): UseLoadingReturn {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const withLoading = useCallback(async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    withLoading,
  };
}