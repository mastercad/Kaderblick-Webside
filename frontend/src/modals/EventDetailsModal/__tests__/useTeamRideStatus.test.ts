import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTeamRideStatus } from '../hooks/useTeamRideStatus';

const mockApiJson = jest.fn();
jest.mock('../../../utils/api', () => ({
  apiJson: (...args: unknown[]) => mockApiJson(...args),
}));

describe('useTeamRideStatus', () => {
  beforeEach(() => {
    mockApiJson.mockReset();
  });

  it('returns "none" when modal is closed', () => {
    const { result } = renderHook(() => useTeamRideStatus(5, false, true));
    expect(result.current).toBe('none');
    expect(mockApiJson).not.toHaveBeenCalled();
  });

  it('returns "none" when canViewRides is false', () => {
    const { result } = renderHook(() => useTeamRideStatus(5, true, false));
    expect(result.current).toBe('none');
    expect(mockApiJson).not.toHaveBeenCalled();
  });

  it('returns "none" when eventId is undefined', () => {
    const { result } = renderHook(() => useTeamRideStatus(undefined, true, true));
    expect(result.current).toBe('none');
    expect(mockApiJson).not.toHaveBeenCalled();
  });

  it('returns "none" when API returns no rides', async () => {
    mockApiJson.mockResolvedValue({ rides: [] });

    const { result } = renderHook(() => useTeamRideStatus(5, true, true));

    await waitFor(() => expect(mockApiJson).toHaveBeenCalled());
    expect(result.current).toBe('none');
  });

  it('returns "full" when all rides have 0 available seats', async () => {
    mockApiJson.mockResolvedValue({
      rides: [{ availableSeats: 0 }, { availableSeats: 0 }],
    });

    const { result } = renderHook(() => useTeamRideStatus(5, true, true));

    await waitFor(() => expect(result.current).toBe('full'));
  });

  it('returns "free" when at least one ride has available seats', async () => {
    mockApiJson.mockResolvedValue({
      rides: [{ availableSeats: 0 }, { availableSeats: 3 }],
    });

    const { result } = renderHook(() => useTeamRideStatus(5, true, true));

    await waitFor(() => expect(result.current).toBe('free'));
  });

  it('fetches from correct URL', async () => {
    mockApiJson.mockResolvedValue({ rides: [] });

    renderHook(() => useTeamRideStatus(42, true, true));

    await waitFor(() => expect(mockApiJson).toHaveBeenCalled());
    expect(mockApiJson).toHaveBeenCalledWith('/api/teamrides/event/42');
  });

  it('returns "none" on network error', async () => {
    mockApiJson.mockRejectedValue(new Error('network failure'));

    const { result } = renderHook(() => useTeamRideStatus(5, true, true));

    await waitFor(() => expect(mockApiJson).toHaveBeenCalled());
    // After error, stays at 'none'
    expect(result.current).toBe('none');
  });
});
