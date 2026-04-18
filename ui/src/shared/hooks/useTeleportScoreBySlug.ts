import { useEffect, useState } from 'react';
import type { TeleportScore } from './useTeleportScore';

const cache = new Map<string, TeleportScore | null>();

export function useTeleportScoreBySlug(
  slug: string,
  enabled: boolean = true,
): { data: TeleportScore | null; loading: boolean } {
  const hit = cache.get(slug);
  const shouldFetch = enabled && Boolean(slug);
  const [data, setData]       = useState<TeleportScore | null>(hit !== undefined ? hit : null);
  const [loading, setLoading] = useState(shouldFetch && hit === undefined);

  useEffect(() => {
    if (!shouldFetch) return;
    if (cache.has(slug)) return;
    let cancelled = false;

    fetch(`https://api.teleport.org/api/urban_areas/slug:${slug}/scores/`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        const score: TeleportScore = {
          teleport_city_score: Math.round(d.teleport_city_score ?? 0),
          summary: d.summary ?? '',
          categories: d.categories ?? [],
        };
        cache.set(slug, score);
        if (!cancelled) { setData(score); setLoading(false); }
      })
      .catch(() => {
        cache.set(slug, null);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, shouldFetch]);

  return { data, loading };
}
