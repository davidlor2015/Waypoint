import { useMemo } from 'react';
import type { Itinerary } from '../../../shared/api/ai';
import { useGeocodeQueries } from '../../../shared/hooks/useGeocode';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ItineraryPin {
  eventKey: string;             // unique React key: `${dayNumber}-${eventIndex}`
  label: string;                // activity title
  time: string | null;
  location: string | null;
  coords: [number, number];
  dayNumber: number;
  eventIndex: number;           // 1-based position within the day
  dayColor: string;             // hex colour for this day's markers and polyline
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Cycles through brand colours per day (amber, clay, olive, danger, espresso).
const DAY_COLORS = ['#B45309', '#8B5A3E', '#3F6212', '#881337', '#1C1917'];

function hasFiniteCoords(lat: number | null | undefined, lon: number | null | undefined): lat is number {
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function spreadOverlappingPins(pins: ItineraryPin[]): ItineraryPin[] {
  const groups = new Map<string, ItineraryPin[]>();

  for (const pin of pins) {
    const key = `${pin.coords[0].toFixed(6)},${pin.coords[1].toFixed(6)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(pin);
    } else {
      groups.set(key, [pin]);
    }
  }

  const spread: ItineraryPin[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      spread.push(group[0]);
      continue;
    }

    const [baseLat, baseLon] = group[0].coords;
    const radius = 0.0012;

    group.forEach((pin, index) => {
      const angle = (2 * Math.PI * index) / group.length;
      const latOffset = Math.sin(angle) * radius;
      const lonOffset = Math.cos(angle) * radius;

      spread.push({
        ...pin,
        coords: [baseLat + latOffset, baseLon + lonOffset],
      });
    });
  }

  return spread;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Derives a flat list of map-ready pins from an Itinerary.
 *
 * Priority:
 *   1. item.lat / item.lon present (Smart Plan geocodes at generation time)
 *   2. item.location string → geocoded via the shared Nominatim cache
 *
 * Events with neither field are silently skipped.
 */
export function useItineraryPins(
  itinerary: Itinerary,
): { pins: ItineraryPin[]; loading: boolean } {
  const queriesToGeocode = useMemo(() => {
    const queries: Array<{ key: string; query: string; label: string; fallbackQueries: string[] }> = [];
    for (const day of itinerary.days) {
      let eventIndex = 1;
      for (const item of day.items) {
        if (!hasFiniteCoords(item.lat, item.lon) && item.location) {
          const specificQuery = `${item.title}, ${item.location}`;
          queries.push({
            key: `${day.day_number}-${eventIndex}`,
            query: specificQuery,
            label: `${day.day_number}-${eventIndex}`,
            fallbackQueries: [item.location],
          });
        }
        eventIndex++;
      }
    }
    return queries;
  }, [itinerary]);

  const { pins: geocodedPins, loading } = useGeocodeQueries(queriesToGeocode);

  // Build an event key → coords lookup from geocoding results.
  const geocodedMap = useMemo(() => {
    const m = new Map<string, [number, number]>();
    for (const p of geocodedPins) {
      m.set(p.destination, p.coords);
    }
    return m;
  }, [geocodedPins]);

  const pins = useMemo<ItineraryPin[]>(() => {
    const result: ItineraryPin[] = [];
    for (const day of itinerary.days) {
      const dayColor = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];
      let eventIndex = 1;
      for (const item of day.items) {
        let coords: [number, number] | null = null;

        if (hasFiniteCoords(item.lat, item.lon)) {
          coords = [item.lat, item.lon];
        } else if (item.location) {
          coords = geocodedMap.get(`${day.day_number}-${eventIndex}`) ?? null;
        }

        if (coords !== null) {
          result.push({
            eventKey:   `${day.day_number}-${eventIndex}`,
            label:      item.title,
            time:       item.time,
            location:   item.location,
            coords,
            dayNumber:  day.day_number,
            eventIndex,
            dayColor,
          });
        }

        eventIndex++;
      }
    }
    return spreadOverlappingPins(result);
  }, [itinerary, geocodedMap]);

  return { pins, loading };
}
