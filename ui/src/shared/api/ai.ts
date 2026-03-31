// src/shared/api/ai.ts
import { API_URL } from '../../app/config';

export interface ItineraryItem {
    time: string | null;
    title: string;
    location: string | null;
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

export const planItinerary = async (
    token: string,
    tripId: number,
    options?: { interests_override?: string; budget_override?: string }
): Promise<Itinerary> => {
    const response = await fetch(`${API_URL}/v1/ai/plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trip_id: tripId, ...options }),
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
    options?: { interests_override?: string; budget_override?: string }
): Promise<Itinerary> => {
    const response = await fetch(`${API_URL}/v1/ai/plan-smart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trip_id: tripId, ...options }),
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
    itinerary: Itinerary
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
