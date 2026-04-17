import { useCallback, useState } from 'react';

const STORAGE_KEY = 'explore_wishlist';

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

interface UseWishlistReturn {
  savedIds: ReadonlySet<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export function useWishlist(): UseWishlistReturn {
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(
    () => new Set(loadIds()),
  );

  const toggle = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // storage quota exceeded — state still updates in memory
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  return { savedIds, toggle, isSaved };
}
