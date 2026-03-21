import { useState, useEffect } from 'react';
import { apiJson } from '../../../utils/api';
import type { CurrentParticipation, Participation, ParticipationStatus } from '../types';

export function useEventParticipation(
  eventId: number | undefined,
  open: boolean,
  canParticipate: boolean | undefined,
) {
  const [participationStatuses, setParticipationStatuses] = useState<ParticipationStatus[]>([]);
  const [currentParticipation, setCurrentParticipation] = useState<CurrentParticipation | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyMyParticipation = (mp: Record<string, unknown> | null) => {
    if (!mp) {
      setCurrentParticipation(null);
      return;
    }
    setCurrentParticipation({
      statusId: mp.status_id as number,
      statusName: mp.status_name as string,
      color: mp.status_color as string | undefined,
      icon: mp.status_icon as string | undefined,
      note: mp.note as string | undefined,
    });
  };

  useEffect(() => {
    if (!eventId || !open || !canParticipate) {
      setParticipationStatuses([]);
      setCurrentParticipation(null);
      setParticipations([]);
      return;
    }
    setLoading(true);
    Promise.all([
      apiJson(`/api/participation/statuses`),
      apiJson(`/api/participation/event/${eventId}`).catch(() => ({})),
    ])
      .then(([statusesResponse, list]) => {
        setParticipationStatuses(
          Array.isArray(statusesResponse.statuses) ? statusesResponse.statuses : [],
        );
        setParticipations(list.participations ?? []);
        applyMyParticipation(list.my_participation ?? null);
      })
      .catch(() => {
        setParticipationStatuses([]);
        setCurrentParticipation(null);
        setParticipations([]);
      })
      .finally(() => setLoading(false));
  }, [eventId, open, canParticipate]);

  const refreshParticipations = async () => {
    if (!eventId) return;
    const list = await apiJson(`/api/participation/event/${eventId}`);
    setParticipations(list.participations ?? []);
    applyMyParticipation(list.my_participation ?? null);
  };

  const submitParticipation = async (statusId: number, note: string) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const response = await apiJson(`/api/participation/event/${eventId}/respond`, {
        method: 'POST',
        body: { status_id: statusId, note },
      });
      if (response.my_participation) {
        applyMyParticipation(response.my_participation);
      }
      await refreshParticipations();
    } finally {
      setSaving(false);
    }
  };

  return {
    participationStatuses,
    currentParticipation,
    participations,
    loading,
    saving,
    submitParticipation,
    refreshParticipations,
  };
}
