import { API_URL } from '../../app/config';

// ── Types (mirror app/schemas/search.py) ──────────────────────────────────────

export interface Segment {
  departure_iata: string;
  departure_at: string;
  arrival_iata: string;
  arrival_at: string;
  carrier_code: string;
  number: string;
  duration: string;
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface FlightOffer {
  id: string;
  price: string;
  currency: string;
  itineraries: Itinerary[];
}

export interface FlightSearchResult {
  offers: FlightOffer[];
  count: number;
  test_env: boolean;
}

export interface FlightInspiration {
  destination: string;
  departure_date: string;
  return_date: string | null;
  price: string;
}

export interface InspirationResult {
  origin: string;
  suggestions: FlightInspiration[];
  test_env: boolean;
}

// ── API helpers ───────────────────────────────────────────────────────────────

export async function searchFlights(
  token: string,
  origin: string,
  destination: string,
  date: string,
  adults: number = 1,
): Promise<FlightSearchResult> {
  const params = new URLSearchParams({
    origin,
    destination,
    date,
    adults: String(adults),
  });
  const res = await fetch(`${API_URL}/v1/search/flights?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Search failed (${res.status})`);
  }
  return res.json();
}

export async function getInspirations(
  token: string,
  origin: string,
  maxPrice?: number,
): Promise<InspirationResult> {
  const params = new URLSearchParams({ origin });
  if (maxPrice) params.set('max_price', String(maxPrice));
  const res = await fetch(`${API_URL}/v1/search/inspirations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Inspirations failed (${res.status})`);
  }
  return res.json();
}
