import { useEffect, useState } from 'react';

const BASE = 'https://api.teleport.org/api';

async function fetchScoreBySlug(slug: string): Promise<[string, number] | null> {
  try {
    const res = await fetch(`${BASE}/urban_areas/slug:${slug}/scores/`);
    if (!res.ok) return null;
    const data = await res.json();
    return [slug, Math.round(data.teleport_city_score ?? 0)];
  } catch {
    return null;
  }
}

interface UseAllTeleportScoresReturn {
  scores: ReadonlyMap<string, number>;
  loading: boolean;
}

export function useAllTeleportScores(slugs: readonly string[]): UseAllTeleportScoresReturn {
  const [scores,  setScores]  = useState<ReadonlyMap<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const key = slugs.join('\x00');

  useEffect(() => {
    if (slugs.length === 0) return;
    let cancelled = false;
    setLoading(true);

    Promise.all(slugs.map(fetchScoreBySlug)).then((results) => {
      if (cancelled) return;
      const map = new Map<string, number>();
      for (const entry of results) {
        if (entry) map.set(entry[0], entry[1]);
      }
      setScores(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { scores, loading };
}
