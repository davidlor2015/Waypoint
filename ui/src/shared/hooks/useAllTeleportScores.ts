import { useEffect, useState } from 'react';

const BASE = 'https://api.teleport.org/api';

async function fetchOneScore(city: string): Promise<[string, number] | null> {
  try {
    const searchRes = await fetch(
      `${BASE}/cities/?search=${encodeURIComponent(city)}&limit=1`,
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const uaHref: string | undefined =
      searchData?._embedded?.['city:search-results']?.[0]?._links?.['city:urban_area']?.href;
    if (!uaHref) return null;
    const slug = uaHref.match(/slug:([^/]+)/)?.[1];
    if (!slug) return null;
    const scoresRes = await fetch(`${BASE}/urban_areas/slug:${slug}/scores/`);
    if (!scoresRes.ok) return null;
    const scoresData = await scoresRes.json();
    return [city, Math.round(scoresData.teleport_city_score ?? 0)];
  } catch {
    return null;
  }
}

interface UseAllTeleportScoresReturn {
  scores: ReadonlyMap<string, number>;
  loading: boolean;
}

export function useAllTeleportScores(cities: readonly string[]): UseAllTeleportScoresReturn {
  const [scores,  setScores]  = useState<ReadonlyMap<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  // Stable primitive key — avoids re-fetching on referential identity changes
  const key = cities.join('\x00');

  useEffect(() => {
    if (cities.length === 0) return;
    let cancelled = false;
    setLoading(true);

    Promise.all(cities.map(fetchOneScore)).then((results) => {
      if (cancelled) return;
      const map = new Map<string, number>();
      for (const entry of results) {
        if (entry) map.set(entry[0], entry[1]);
      }
      setScores(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
    // key is a stable serialisation of cities — correct dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { scores, loading };
}
