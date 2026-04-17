import { API_URL } from '../../app/config';

export interface PackingItem {
  id: number;
  trip_id: number;
  label: string;
  checked: boolean;
  created_at: string;
}

const base = (tripId: number) => `${API_URL}/v1/trips/${tripId}/packing`;

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export async function getPackingItems(token: string, tripId: number): Promise<PackingItem[]> {
  const res = await fetch(`${base(tripId)}/`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Failed to load packing list (${res.status})`);
  return res.json();
}

export async function createPackingItem(token: string, tripId: number, label: string): Promise<PackingItem> {
  const res = await fetch(`${base(tripId)}/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(`Failed to add packing item (${res.status})`);
  return res.json();
}

export async function updatePackingItem(
  token: string,
  tripId: number,
  itemId: number,
  patch: { label?: string; checked?: boolean },
): Promise<PackingItem> {
  const res = await fetch(`${base(tripId)}/${itemId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update packing item (${res.status})`);
  return res.json();
}

export async function deletePackingItem(token: string, tripId: number, itemId: number): Promise<void> {
  const res = await fetch(`${base(tripId)}/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete packing item (${res.status})`);
}
