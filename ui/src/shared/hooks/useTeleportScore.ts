import { useEffect, useState } from 'react';

export interface TeleportScore {
  teleport_city_score: number;   // 0–100
  summary: string;
}

interface State {
  data: TeleportScore | null;
  loading: boolean;
}

/**
 * Fetches a Teleport urban-area quality score for a given city name.
 * Calls the public Teleport API directly (CORS-enabled, no key required).
 * Returns null silently if the city is not found — cards degrade gracefully.
 */
export function useTeleportScore(city: string): State {
  const [state, setState] = useState<State>({ data: null, loading: false });

  useEffect(() => {
    if (!city) return;
    let cancelled = false;

    (async () => {
      setState({ data: null, loading: true });
      try {
        // 1. Find the city's urban-area href
        const searchRes = await fetch(
          `https://api.teleport.org/api/cities/?search=${encodeURIComponent(city)}&limit=1`,
        );
        if (!searchRes.ok) return;
        const searchData = await searchRes.json();
        const uaHref: string | undefined =
          searchData?._embedded?.['city:search-results']?.[0]?._links?.['city:urban_area']?.href;
        if (!uaHref) return;

        // 2. Extract slug from href, e.g. ".../slug:tokyo/"
        const slug = uaHref.match(/slug:([^/]+)/)?.[1];
        if (!slug) return;

        // 3. Fetch scores
        const scoresRes = await fetch(
          `https://api.teleport.org/api/urban_areas/slug:${slug}/scores/`,
        );
        if (!scoresRes.ok) return;
        const scoresData = await scoresRes.json();

        if (!cancelled) {
          setState({
            loading: false,
            data: {
              teleport_city_score: Math.round(scoresData.teleport_city_score ?? 0),
              summary: scoresData.summary ?? '',
            },
          });
        }
      } catch {
        if (!cancelled) setState({ data: null, loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, [city]);

  return state;
}
