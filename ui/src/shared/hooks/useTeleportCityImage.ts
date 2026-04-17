import { useEffect, useState } from 'react';

// Wikipedia article titles that differ from the city display name
const WIKI_OVERRIDES: Record<string, string> = {
  'New York':    'New York City',
  'Bali':        'Bali',
  'Reykjavik':   'Reykjavík',
  'Cape Town':   'Cape Town',
  'Queenstown':  'Queenstown, New Zealand',
  'Marrakech':   'Marrakesh',
  'Bangkok':     'Bangkok',
};

const cache = new Map<string, string | null>();

export function useTeleportCityImage(city: string): { imageUrl: string | null; loading: boolean } {
  const hit = cache.get(city);
  const [imageUrl, setImageUrl] = useState<string | null>(hit !== undefined ? hit : null);
  const [loading, setLoading]   = useState(hit === undefined);

  useEffect(() => {
    if (cache.has(city)) return;
    let cancelled = false;

    const wikiTitle = WIKI_OVERRIDES[city] ?? city;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`)
      .then((r) => r.json())
      .then((data) => {
        const url: string | null = data.originalimage?.source ?? data.thumbnail?.source ?? null;
        cache.set(city, url);
        if (!cancelled) { setImageUrl(url); setLoading(false); }
      })
      .catch(() => {
        cache.set(city, null);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [city]);

  return { imageUrl, loading };
}
