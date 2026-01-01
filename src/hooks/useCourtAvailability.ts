import { useState, useCallback, useEffect } from 'react';
import { getCourtAvailability } from '../api/badminton';
import type { CourtAvailability } from '../types/badminton';

interface UseCourtAvailabilityReturn {
  courts: CourtAvailability[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isInitialized: boolean;
}

export function useCourtAvailability(
  autoFetch = true,
  refreshInterval?: number
): UseCourtAvailabilityReturn {
  const [courts, setCourts] = useState<CourtAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourtAvailability();
      setCourts(data);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courts';
      setError(errorMessage);
      console.error('Error fetching court availability:', err);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCourts();
    }
  }, [autoFetch, fetchCourts]);

  // Set up periodic refresh if interval is provided
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(fetchCourts, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchCourts]);

  return {
    courts,
    loading,
    error,
    refetch: fetchCourts,
    isInitialized
  };
}
