import { useState, useEffect, useCallback } from 'react';
import {
  getPackingItems,
  createPackingItem,
  updatePackingItem,
  deletePackingItem,
  type PackingItem,
} from '../../../shared/api/packing';

export type { PackingItem };

interface UsePackingListReturn {
  items: PackingItem[];
  loading: boolean;
  error: string | null;
  addItem: (label: string) => Promise<void>;
  toggleItem: (id: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearChecked: () => Promise<void>;
}

export function usePackingList(token: string, tripId: number): UsePackingListReturn {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPackingItems(token, tripId)
      .then((data) => { if (!cancelled) setItems(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, tripId]);

  const addItem = useCallback(async (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const item = await createPackingItem(token, tripId, trimmed);
    setItems((prev) => [...prev, item]);
  }, [token, tripId]);

  const toggleItem = useCallback(async (id: number) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const updated = await updatePackingItem(token, tripId, id, { checked: !current.checked });
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  }, [token, tripId, items]);

  const removeItem = useCallback(async (id: number) => {
    await deletePackingItem(token, tripId, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [token, tripId]);

  const clearChecked = useCallback(async () => {
    const checked = items.filter((i) => i.checked);
    await Promise.all(checked.map((i) => deletePackingItem(token, tripId, i.id)));
    setItems((prev) => prev.filter((i) => !i.checked));
  }, [token, tripId, items]);

  return { items, loading, error, addItem, toggleItem, removeItem, clearChecked };
}
