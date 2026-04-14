import { useState, useEffect, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
}

export interface GeocodedPin {
  destination: string;
  coords: [number, number];
}

// ── Module-level cache (persists for the lifetime of the session) ─────────────

const geocodeCache = new Map<string, [number, number] | null>();

// ── Private helpers ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchCoords(destination: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TravelPlannerApp/1.0' } },
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

// ── Hook ──────────────────────────────────────────────────────────────────────

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

    if (unique.length === 0) {
      setPins([]);
      return;
    }

    const toFetch = unique.filter((d) => !geocodeCache.has(d));

    // All results already cached — resolve without setting loading.
    if (toFetch.length === 0) {
      setPins(buildPins(unique));
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      for (let i = 0; i < toFetch.length; i++) {
        if (cancelled) break;
        if (i > 0) await sleep(1100); // Nominatim policy: max 1 request/second
        const coords = await fetchCoords(toFetch[i]);
        geocodeCache.set(toFetch[i], coords);
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
