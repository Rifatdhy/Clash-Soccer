/**
 * Custom hooks for data fetching
 * Reduces boilerplate in components
 */

import { useState, useEffect } from "react";

interface UseFetchDataOptions<T> {
  fetchFn: () => Promise<T>;
  fallback: T;
  dependencies?: any[];
}

interface UseFetchDataReturn<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic data fetching hook with loading and error states
 */
export function useFetchData<T>({
  fetchFn,
  fallback,
  dependencies = [],
}: UseFetchDataOptions<T>): UseFetchDataReturn<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching multiple data sources in parallel
 */
export function useFetchMultiple<T extends Record<string, any>>(
  fetchers: { [K in keyof T]: () => Promise<T[K]> },
  fallbacks: T
): UseFetchDataReturn<T> {
  const [data, setData] = useState<T>(fallbacks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const keys = Object.keys(fetchers) as Array<keyof T>;
      const promises = keys.map((key) => fetchers[key]());
      const results = await Promise.all(promises);

      const newData = keys.reduce((acc, key, index) => {
        acc[key] = results[index];
        return acc;
      }, {} as T);

      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData(fallbacks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch: fetchAll };
}