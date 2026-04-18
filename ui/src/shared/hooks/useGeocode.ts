import { useState, useEffect, useMemo } from 'react';



interface NominatimResult {
  lat: string;
  lon: string;
}

export interface GeocodedPin {
  destination: string;
  coords: [number, number];
}

export interface GeocodeQuery {
  key: string;
  query: string;
  label?: string;
  fallbackQueries?: string[];
}



const geocodeCache = new Map<string, [number, number] | null>();


const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchCoords(destination: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'WaypointApp/1.0' } },
    );
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0] as NominatimResult;
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    return isNaN(lat) || isNaN(lon) ? null : [lat, lon];
  } catch {
    return null;
  }
}

function buildPins(destinations: string[]): GeocodedPin[] {
  return destinations.flatMap((d) => {
    const coords = geocodeCache.get(d);
    return coords ? [{ destination: d, coords }] : [];
  });
}

function buildPinsFromQueries(queries: GeocodeQuery[]): GeocodedPin[] {
  return queries.flatMap((item) => {
    const candidates = [item.query, ...(item.fallbackQueries ?? [])];
    for (const candidate of candidates) {
      const coords = geocodeCache.get(candidate);
      if (coords) {
        return [{ destination: item.label ?? item.key, coords }];
      }
    }
    return [];
  });
}



/**
 * Geocodes an array of destination strings via Nominatim (OpenStreetMap).
 * Results are cached at module scope so the same destination is never
 * fetched twice within a session. Requests are spaced 1.1 s apart to
 * respect Nominatim's rate limit of 1 req/s.
 */
export function useGeocode(destinations: string[]): { pins: GeocodedPin[]; loading: boolean } {
  const [pins, setPins] = useState<GeocodedPin[]>([]);
  const [loading, setLoading] = useState(false);

  // Stable string key — only changes when the set of destinations changes,
  // not on every parent re-render that produces a new array reference.
  const stableKey = useMemo(
    () => [...new Set(destinations)].sort().join('||'),
    [destinations],
  );

  useEffect(() => {
    // Reconstruct unique list from the stable key so the effect closure is
    // only bound to `stableKey`, avoiding stale-closure issues.
    const unique = stableKey.length > 0 ? stableKey.split('||') : [];
    let cancelled = false;

    (async () => {
      if (unique.length === 0) {
        setPins([]);
        return;
      }

      const toFetch = unique.filter((d) => !geocodeCache.has(d));

      if (toFetch.length > 0) {
        setLoading(true);
        for (let i = 0; i < toFetch.length; i++) {
          if (cancelled) break;
          if (i > 0) await sleep(1100); // Nominatim policy: max 1 request/second
          const coords = await fetchCoords(toFetch[i]);
          geocodeCache.set(toFetch[i], coords);
        }
      }

      if (!cancelled) {
        setPins(buildPins(unique));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stableKey]);

  return { pins, loading };
}

export function useGeocodeQueries(queries: GeocodeQuery[]): { pins: GeocodedPin[]; loading: boolean } {
  const [pins, setPins] = useState<GeocodedPin[]>([]);
  const [loading, setLoading] = useState(false);

  const stableKey = useMemo(
    () =>
      [...queries]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((item) => `${item.key}::${item.query}::${(item.fallbackQueries ?? []).join('|')}`)
        .join('||'),
    [queries],
  );

  useEffect(() => {
    const uniqueQueries = stableKey.length > 0
      ? stableKey.split('||').map((entry) => {
          const [key, query, fallbackBlob = ''] = entry.split('::');
          return {
            key,
            query,
            fallbackQueries: fallbackBlob ? fallbackBlob.split('|').filter(Boolean) : [],
          };
        })
      : [];

    const lookup = new Map(queries.map((item) => [item.key, item]));
    const orderedQueries = uniqueQueries
      .map((item) => lookup.get(item.key))
      .filter((item): item is GeocodeQuery => Boolean(item));

    let cancelled = false;

    (async () => {
      if (orderedQueries.length === 0) {
        setPins([]);
        return;
      }

      const toFetch = orderedQueries.flatMap((item) =>
        [item.query, ...(item.fallbackQueries ?? [])].filter((candidate) => !geocodeCache.has(candidate)),
      );
      const dedupedToFetch = [...new Set(toFetch)];

      if (dedupedToFetch.length > 0) {
        setLoading(true);
        for (let i = 0; i < dedupedToFetch.length; i++) {
          if (cancelled) break;
          if (i > 0) await sleep(1100);
          const coords = await fetchCoords(dedupedToFetch[i]);
          geocodeCache.set(dedupedToFetch[i], coords);
        }
      }

      if (!cancelled) {
        setPins(buildPinsFromQueries(orderedQueries));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queries, stableKey]);

  return { pins, loading };
}
