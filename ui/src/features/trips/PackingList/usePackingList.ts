import { useReducer, useEffect, useCallback } from 'react';
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

type PackingState = { loading: boolean; error: string | null; items: PackingItem[] };
type PackingAction =
  | { type: 'fetch/start' }
  | { type: 'fetch/done'; items: PackingItem[] }
  | { type: 'fetch/error'; message: string }
  | { type: 'item/add'; item: PackingItem }
  | { type: 'item/update'; item: PackingItem }
  | { type: 'item/remove'; id: number }
  | { type: 'checked/clear' };

function packingReducer(state: PackingState, action: PackingAction): PackingState {
  switch (action.type) {
    case 'fetch/start':   return { ...state, loading: true, error: null };
    case 'fetch/done':    return { loading: false, error: null, items: action.items };
    case 'fetch/error':   return { ...state, loading: false, error: action.message };
    case 'item/add':      return { ...state, items: [...state.items, action.item] };
    case 'item/update':   return { ...state, items: state.items.map((i) => (i.id === action.item.id ? action.item : i)) };
    case 'item/remove':   return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'checked/clear': return { ...state, items: state.items.filter((i) => !i.checked) };
  }
}

export function usePackingList(token: string, tripId: number): UsePackingListReturn {
  const [{ items, loading, error }, dispatch] = useReducer(packingReducer, {
    loading: true, error: null, items: [],
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'fetch/start' });
    getPackingItems(token, tripId)
      .then((data) => { if (!cancelled) dispatch({ type: 'fetch/done', items: data }); })
      .catch((err) => { if (!cancelled) dispatch({ type: 'fetch/error', message: err instanceof Error ? err.message : 'Failed to load' }); });
    return () => { cancelled = true; };
  }, [token, tripId]);

  const addItem = useCallback(async (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const item = await createPackingItem(token, tripId, trimmed);
    dispatch({ type: 'item/add', item });
  }, [token, tripId]);

  const toggleItem = useCallback(async (id: number) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const updated = await updatePackingItem(token, tripId, id, { checked: !current.checked });
    dispatch({ type: 'item/update', item: updated });
  }, [token, tripId, items]);

  const removeItem = useCallback(async (id: number) => {
    await deletePackingItem(token, tripId, id);
    dispatch({ type: 'item/remove', id });
  }, [token, tripId]);

  const clearChecked = useCallback(async () => {
    const checked = items.filter((i) => i.checked);
    await Promise.all(checked.map((i) => deletePackingItem(token, tripId, i.id)));
    dispatch({ type: 'checked/clear' });
  }, [token, tripId, items]);

  return { items, loading, error, addItem, toggleItem, removeItem, clearChecked };
}
