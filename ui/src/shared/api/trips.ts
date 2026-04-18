// src/shared/api/trips.ts
import { API_URL } from '../../app/config';


export interface Trip {
    id: number;
    title: string;
    destination: string;
    description: string | null;
    notes: string | null;
    start_date: string;
    end_date: string;
    user_id: number;
    created_at: string;

}

export interface TripSummary {
    trip_id: number;
    packing_total: number;
    packing_checked: number;
    packing_progress_pct: number;
    budget_limit: number | null;
    budget_total_spent: number;
    budget_remaining: number | null;
    budget_is_over: boolean;
    budget_expense_count: number;
}

interface TripCreate {
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    description ?: string;
    notes ?: string;
}

export const getTrips = async (token: string): Promise<Trip[]> => {

    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/trips/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch trips (${response.status}): ${text}`);
    }
    
    return response.json();

};

export const createTrip = async (token: string, data: TripCreate): Promise<Trip> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/trips/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create trip');
    }

    return response.json();
  
};

interface TripUpdate {
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export const updateTrip = async (token: string, id: number, data: TripUpdate): Promise<Trip> => {
  const response = await fetch(`${API_URL}/v1/trips/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update trip');
  }
  return response.json();
};

export const deleteTrip = async (token: string, id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/v1/trips/${id}`, {
        method: "DELETE",
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok){
        throw new Error('Failed to delete trip');
    }

};

export const getTripSummaries = async (token: string): Promise<TripSummary[]> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/trips/summaries`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch trip summaries (${response.status}): ${text}`);
    }

    return response.json();
};
