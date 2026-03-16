export interface TripItem {
    title: string;
    time?: string;
    location?: string;
    cost?: string;
}

export interface DayPlan {
    day_number: number;
    items: TripItem[];
}

export interface Itinerary {
    days: DayPlan[];
    budget_breakdown?: string;
    packing_list?: string;
    trips?: string;
}