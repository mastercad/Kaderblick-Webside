import { useState, useEffect } from 'react';
import { apiJson } from '../../../utils/api';

export type TeamRideStatus = 'none' | 'full' | 'free';

export function useTeamRideStatus(
  eventId: number | undefined,
  open: boolean,
  canViewRides: boolean | undefined,
): TeamRideStatus {
  const [status, setStatus] = useState<TeamRideStatus>('none');

  useEffect(() => {
    if (!eventId || !open || !canViewRides) {
      setStatus('none');
      return;
    }
    apiJson(`/api/teamrides/event/${eventId}`)
      .then(data => {
        const rides: { availableSeats: number }[] = data.rides || [];
        if (rides.length === 0) {
          setStatus('none');
        } else if (rides.every(r => r.availableSeats === 0)) {
          setStatus('full');
        } else {
          setStatus('free');
        }
      })
      .catch(() => setStatus('none'));
  }, [eventId, open, canViewRides]);

  return status;
}
