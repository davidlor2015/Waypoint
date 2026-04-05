// src/shared/api/ai.ts
import { API_URL } from '../../app/config';

export interface ItineraryItem {
    time: string | null;
    title: string;
    location: string | null;
    lat: number | null;
    lon: number | null;
    notes: string | null;
    cost_estimate: string | null;
}

export interface DayPlan {
    day_number: number;
    date: string | null;
    items: ItineraryItem[];
}

export interface Itinerary {
    title: string;
    summary: string;
    days: DayPlan[];
    budget_breakdown: Record<string, string> | null;
    packing_list: string[] | null;
    tips: string[] | null;
}

/**
 * How long (ms) to wait for an AI generation response before aborting.
 *
 * Ollama on a CPU can take 60–120 s; we allow 3 minutes to be safe.
 * This constant is used by TripList to create an AbortController and
 * is exported so the UI can show a "taking too long" hint before the
 * hard cutoff.
 *
 * When the backend adds an SSE endpoint, replace the fetch calls below
 * with `new EventSource(...)` and remove the AbortController timeout —
 * streaming responses solve the timeout problem at the protocol level.
 */
export const AI_REQUEST_TIMEOUT_MS = 180_000; // 3 minutes
export const AI_SLOW_THRESHOLD_MS = 30_000;   // show hint after 30 s

export const planItinerary = async (
    token: string,
    tripId: number,
    options?: { interests_override?: string; budget_override?: string },
    signal?: AbortSignal,
): Promise<Itinerary> => {
    const response = await fetch(`${API_URL}/v1/ai/plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trip_id: tripId, ...options }),
        signal,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to generate itinerary (${response.status}): ${text}`);
    }

    return response.json();
};

export const planItinerarySmart = async (
    token: string,
    tripId: number,
    options?: { interests_override?: string; budget_override?: string },
    signal?: AbortSignal,
): Promise<Itinerary> => {
    const response = await fetch(`${API_URL}/v1/ai/plan-smart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trip_id: tripId, ...options }),
        signal,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to generate itinerary (${response.status}): ${text}`);
    }

    return response.json();
};

export const applyItinerary = async (
    token: string,
    tripId: number,
    itinerary: Itinerary,
): Promise<void> => {
    const response = await fetch(`${API_URL}/v1/ai/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trip_id: tripId, itinerary }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to apply itinerary (${response.status}): ${text}`);
    }
};
