export interface AirportOption {
  iata: string;
  city: string;
  country: string;
}

export const AIRPORT_OPTIONS: AirportOption[] = [
  { iata: 'LHR', city: 'London', country: 'UK' },
  { iata: 'JFK', city: 'New York', country: 'USA' },
  { iata: 'LAX', city: 'Los Angeles', country: 'USA' },
  { iata: 'CDG', city: 'Paris', country: 'France' },
  { iata: 'NRT', city: 'Tokyo', country: 'Japan' },
  { iata: 'DXB', city: 'Dubai', country: 'UAE' },
  { iata: 'SIN', city: 'Singapore', country: 'Singapore' },
  { iata: 'SYD', city: 'Sydney', country: 'Australia' },
  { iata: 'MAD', city: 'Madrid', country: 'Spain' },
  { iata: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { iata: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { iata: 'BKK', city: 'Bangkok', country: 'Thailand' },
  { iata: 'HND', city: 'Tokyo', country: 'Japan' },
  { iata: 'YYZ', city: 'Toronto', country: 'Canada' },
  { iata: 'GRU', city: 'São Paulo', country: 'Brazil' },
  { iata: 'JNB', city: 'Johannesburg', country: 'South Africa' },
];

export function parseAirportInput(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length === 3) return trimmed;

  const matched = AIRPORT_OPTIONS.find((option) => {
    const label = `${option.city} (${option.iata})`.toUpperCase();
    return label === trimmed || option.city.toUpperCase() === trimmed;
  });

  return matched?.iata ?? trimmed.slice(0, 3);
}
