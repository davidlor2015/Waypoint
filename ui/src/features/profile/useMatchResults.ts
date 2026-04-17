import { useEffect, useState } from 'react';

import { getMatches, type MatchResult } from '../../shared/api/matching';


interface UseMatchResultsResult {
  results: MatchResult[];
  loading: boolean;
  error: string | null;
}


export function useMatchResults(
  token: string,
  requestId: number | null,
): UseMatchResultsResult {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadResults = async () => {
      if (requestId === null) {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextResults = await getMatches(token, requestId);
        if (!cancelled) {
          setResults(nextResults);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load match results';
          setError(message);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [token, requestId]);

  return { results, loading, error };
}
