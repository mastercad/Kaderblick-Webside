import { useState } from 'react';
import { apiRequest } from '../../../utils/api';

export function useEventActions(
  eventId: number | undefined,
  onCancelled?: () => void,
  onClose?: () => void,
) {
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const cancelEvent = async (reason: string): Promise<boolean> => {
    if (!eventId || !reason.trim()) return false;
    setCancelling(true);
    try {
      const res = await apiRequest(`/api/calendar/event/${eventId}/cancel`, {
        method: 'PATCH',
        body: { reason: reason.trim() },
      });
      if (res.ok) {
        onCancelled?.();
        onClose?.();
        return true;
      }
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error || 'Fehler beim Absagen.');
      return false;
    } catch {
      alert('Fehler beim Absagen.');
      return false;
    } finally {
      setCancelling(false);
    }
  };

  const reactivateEvent = async (): Promise<boolean> => {
    if (!eventId) return false;
    setReactivating(true);
    try {
      const res = await apiRequest(`/api/calendar/event/${eventId}/reactivate`, {
        method: 'PATCH',
      });
      if (res.ok) {
        onCancelled?.();
        onClose?.();
        return true;
      }
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error || 'Fehler beim Reaktivieren.');
      return false;
    } catch {
      alert('Fehler beim Reaktivieren.');
      return false;
    } finally {
      setReactivating(false);
    }
  };

  return { cancelling, reactivating, cancelEvent, reactivateEvent };
}
