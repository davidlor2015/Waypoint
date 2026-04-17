import { useEffect, useState } from 'react';
import {
  getExploreDestinations,
  type ExploreDestination,
  type ExploreDestinationsResult,
  type Region,
} from '../api/search';

interface UseExploreDestinationsResult {
  popular: ExploreDestination[];
  regions: Record<Exclude<Region, 'popular'>, ExploreDestination[]>;
  loading: boolean;
  error: string | null;
}

let cache: ExploreDestinationsResult | null = null;

const EMPTY_REGIONS: Record<Exclude<Region, 'popular'>, ExploreDestination[]> = {
  europe: [],
  asia: [],
  americas: [],
  africa: [],
  oceania: [],
};

export function useExploreDestinations(token: string): UseExploreDestinationsResult {
  const [popular, setPopular] = useState<ExploreDestination[]>(cache?.popular ?? []);
  const [regions, setRegions] = useState<Record<Exclude<Region, 'popular'>, ExploreDestination[]>>(cache?.regions ?? EMPTY_REGIONS);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;

    let cancelled = false;

    getExploreDestinations(token)
      .then((data) => {
        if (cancelled) return;
        cache = data;
        setError(null);
        setPopular(data.popular);
        setRegions(data.regions);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load destinations');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { popular, regions, loading, error };
}
