import { useState, useEffect, useCallback } from 'react';

export interface Task {
  specialist: 'transport' | 'stay' | 'food';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
}

export interface SpecialistOutput {
  specialist: string;
  content: string;
  completedAt?: string;
}

export interface LatestRun {
  _id: string;
  tripId: string;
  executionStage: 'clarify' | 'confirm' | 'dispatch' | 'research' | 'finalize' | 'completed' | 'error';
  tasks: Task[];
  specialistOutputs?: SpecialistOutput[];
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

interface UseLatestRunResult {
  run: LatestRun | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const MAX_CONCURRENT_REQUESTS = 3;

export function useLatestRun(tripId: string | null): UseLatestRunResult {
  const [run, setRun] = useState<LatestRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestRun = useCallback(async () => {
    if (!tripId) {
      setRun(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/latest-run`);

      if (!response.ok) {
        if (response.status === 404) {
          // No run exists for this trip yet
          setRun(null);
          return;
        }
        throw new Error(`Failed to fetch latest run: ${response.statusText}`);
      }

      const data = await response.json();
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch latest run');
      setRun(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchLatestRun();
  }, [fetchLatestRun]);

  return { run, loading, error, refetch: fetchLatestRun };
}

// Hook for fetching multiple runs with concurrency limit
export function useLatestRuns(tripIds: string[]): {
  runs: Map<string, LatestRun>;
  loading: boolean;
  error: string | null;
} {
  const [runs, setRuns] = useState<Map<string, LatestRun>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripIds.length === 0) {
      setRuns(new Map());
      return;
    }

    let cancelled = false;

    const fetchRuns = async () => {
      setLoading(true);
      setError(null);

      const newRuns = new Map<string, LatestRun>();
      const chunks: string[][] = [];

      // Split into chunks for concurrency control
      for (let i = 0; i < tripIds.length; i += MAX_CONCURRENT_REQUESTS) {
        chunks.push(tripIds.slice(i, i + MAX_CONCURRENT_REQUESTS));
      }

      try {
        for (const chunk of chunks) {
          if (cancelled) break;

          const promises = chunk.map(async (tripId) => {
            try {
              const response = await fetch(`/api/trips/${tripId}/latest-run`);
              if (response.ok) {
                const data = await response.json();
                return { tripId, run: data };
              }
              return null;
            } catch {
              return null;
            }
          });

          const results = await Promise.all(promises);
          results.forEach((result) => {
            if (result && result.run) {
              newRuns.set(result.tripId, result.run);
            }
          });
        }

        if (!cancelled) {
          setRuns(newRuns);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch runs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRuns();

    return () => {
      cancelled = true;
    };
  }, [tripIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { runs, loading, error };
}
