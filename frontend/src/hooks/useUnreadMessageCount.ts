import { useState, useEffect, useCallback } from 'react';
import { apiJson } from '../utils/api';

// Module-level listener set — any call to requestRefreshUnreadMessageCount()
// will trigger a re-fetch in every mounted component using this hook.
type Listener = () => void;
const listeners = new Set<Listener>();

export function requestRefreshUnreadMessageCount(): void {
  listeners.forEach(l => l());
}

export function useUnreadMessageCount(): number {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const data = await apiJson('/api/messages/unread-count');
      setCount(data.count ?? 0);
    } catch {
      // fail silently — badge stays at last known value
    }
  }, []);

  useEffect(() => {
    fetchCount();
    listeners.add(fetchCount);
    return () => { listeners.delete(fetchCount); };
  }, [fetchCount]);

  return count;
}
