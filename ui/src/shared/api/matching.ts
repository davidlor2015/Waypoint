import { API_URL } from '../../app/config';


export type TravelStyle = 'adventure' | 'relaxed' | 'cultural' | 'party';
export type BudgetRange = 'budget' | 'mid_range' | 'luxury';
export type MatchRequestStatus = 'open' | 'closed';
export type MatchInteractionStatus = 'interested' | 'intro_saved' | 'passed' | 'accepted' | 'declined';

export interface TravelProfile {
    id: number;
    user_id: number;
    travel_style: TravelStyle;
    budget_range: BudgetRange;
    interests: string[];
    group_size_min: number;
    group_size_max: number;
    is_discoverable: boolean;
}

export interface TravelProfilePayload {
    travel_style: TravelStyle;
    budget_range: BudgetRange;
    interests: string[];
    group_size_min: number;
    group_size_max: number;
    is_discoverable: boolean;
}

export interface MatchRequest {
    id: number;
    trip_id: number;
    user_id: number;
    status: MatchRequestStatus;
    created_at: string;
}

export interface MatchInteraction {
    id: number;
    request_id: number;
    match_result_id: number;
    user_id: number;
    status: MatchInteractionStatus;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface ScoreBreakdown {
    destination: number;
    date_overlap: number;
    travel_style: number;
    budget: number;
    interests: number;
    group_size: number;
}

export interface MatchedTrip {
    id: number;
    destination: string;
    start_date: string;
    end_date: string;
}

export interface MatchedUser {
    id: number;
    email: string;
}

export interface MatchResult {
    id: number;
    score: number;
    breakdown: ScoreBreakdown;
    matched_trip: MatchedTrip;
    matched_user: MatchedUser;
    interaction: MatchInteraction | null;
}

interface OpenRequestResponse {
    request: MatchRequest;
    results: MatchResult[];
}

export const getProfile = async (token: string): Promise<TravelProfile | null> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/profile`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch profile (${response.status}): ${text}`);
    }

    return response.json();
};

export const upsertProfile = async (
    token: string,
    data: TravelProfilePayload,
): Promise<TravelProfile> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to save profile (${response.status}): ${text}`);
    }

    return response.json();
};

export const getRequests = async (token: string): Promise<MatchRequest[]> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/requests`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch requests (${response.status}): ${text}`);
    }

    return response.json();
};

export const openRequest = async (token: string, tripId: number): Promise<OpenRequestResponse> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trip_id: tripId }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to open request (${response.status}): ${text}`);
    }

    return response.json();
};

export const closeRequest = async (token: string, requestId: number): Promise<void> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to close request (${response.status}): ${text}`);
    }
};

export const getMatches = async (token: string, requestId: number): Promise<MatchResult[]> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/requests/${requestId}/matches`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch matches (${response.status}): ${text}`);
    }

    return response.json();
};

export const updateMatchInteraction = async (
    token: string,
    requestId: number,
    matchResultId: number,
    data: { status: MatchInteractionStatus; note?: string | null },
): Promise<MatchResult> => {
    if (!token) {
        throw new Error("No access token provided");
    }

    const response = await fetch(`${API_URL}/v1/matching/requests/${requestId}/matches/${matchResultId}/interaction`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to update match interaction (${response.status}): ${text}`);
    }

    return response.json();
};
