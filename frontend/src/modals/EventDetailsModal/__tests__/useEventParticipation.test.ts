import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useEventParticipation } from '../hooks/useEventParticipation';

const mockApiJson = jest.fn();
jest.mock('../../../utils/api', () => ({
  apiJson: (...args: unknown[]) => mockApiJson(...args),
}));

const STATUS_FIXTURE = {
  statuses: [
    { id: 1, name: 'Zugesagt', code: 'yes', color: '#4caf50', sort_order: 1 },
    { id: 2, name: 'Abgesagt', code: 'no', color: '#f44336', sort_order: 2 },
  ],
};
const PARTICIPATION_FIXTURE = {
  participations: [
    { user_id: 10, user_name: 'Alice', status: { id: 1, name: 'Zugesagt', color: '#4caf50' } },
  ],
  my_participation: {
    status_id: 1,
    status_name: 'Zugesagt',
    status_color: '#4caf50',
    status_icon: undefined,
    note: 'Bin dabei',
  },
};

describe('useEventParticipation', () => {
  beforeEach(() => {
    mockApiJson.mockReset();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() =>
      useEventParticipation(undefined, false, true),
    );
    expect(result.current.participationStatuses).toEqual([]);
    expect(result.current.currentParticipation).toBeNull();
    expect(result.current.participations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when closed', () => {
    renderHook(() => useEventParticipation(5, false, true));
    expect(mockApiJson).not.toHaveBeenCalled();
  });

  it('does not fetch when canParticipate is false', () => {
    renderHook(() => useEventParticipation(5, true, false));
    expect(mockApiJson).not.toHaveBeenCalled();
  });

  it('fetches statuses and participations when open + canParticipate', async () => {
    mockApiJson
      .mockResolvedValueOnce(STATUS_FIXTURE)
      .mockResolvedValueOnce(PARTICIPATION_FIXTURE);

    const { result } = renderHook(() =>
      useEventParticipation(5, true, true),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApiJson).toHaveBeenCalledWith('/api/participation/statuses');
    expect(mockApiJson).toHaveBeenCalledWith('/api/participation/event/5');
    expect(result.current.participationStatuses).toHaveLength(2);
    expect(result.current.participations).toHaveLength(1);
    expect(result.current.currentParticipation?.statusId).toBe(1);
    expect(result.current.currentParticipation?.note).toBe('Bin dabei');
  });

  it('handles fetch error gracefully', async () => {
    mockApiJson.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() =>
      useEventParticipation(5, true, true),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.participationStatuses).toEqual([]);
    expect(result.current.currentParticipation).toBeNull();
  });

  it('submitParticipation POSTs to correct endpoint and refreshes', async () => {
    // Initial load
    mockApiJson
      .mockResolvedValueOnce(STATUS_FIXTURE)
      .mockResolvedValueOnce(PARTICIPATION_FIXTURE)
      // submitParticipation respond call
      .mockResolvedValueOnce({
        my_participation: {
          status_id: 2,
          status_name: 'Abgesagt',
          status_color: '#f44336',
          note: '',
        },
      })
      // refresh call
      .mockResolvedValueOnce({
        participations: PARTICIPATION_FIXTURE.participations,
        my_participation: { status_id: 2, status_name: 'Abgesagt', status_color: '#f44336' },
      });

    const { result } = renderHook(() =>
      useEventParticipation(5, true, true),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitParticipation(2, 'kein Bock');
    });

    expect(mockApiJson).toHaveBeenCalledWith(
      '/api/participation/event/5/respond',
      { method: 'POST', body: { status_id: 2, note: 'kein Bock' } },
    );
    expect(result.current.currentParticipation?.statusId).toBe(2);
    expect(result.current.saving).toBe(false);
  });

  it('sets currentParticipation to null when my_participation is not present', async () => {
    mockApiJson
      .mockResolvedValueOnce(STATUS_FIXTURE)
      .mockResolvedValueOnce({ participations: [], my_participation: null });

    const { result } = renderHook(() =>
      useEventParticipation(5, true, true),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentParticipation).toBeNull();
  });
});
