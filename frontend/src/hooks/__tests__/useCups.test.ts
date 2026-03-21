import { renderHook, waitFor } from '@testing-library/react';
import { useCups } from '../useEventData';

const mockFetchCups = jest.fn();
jest.mock('../../services/cups', () => ({
  fetchCups: (...args: any[]) => mockFetchCups(...args),
}));

// suppress unrelated hooks that share the module
jest.mock('../../utils/api', () => ({
  apiRequest: jest.fn(),
}));
jest.mock('../../services/leagues', () => ({
  fetchLeagues: jest.fn().mockResolvedValue([]),
}));

beforeEach(() => jest.clearAllMocks());

describe('useCups', () => {
  it('returns empty array initially', () => {
    const { result } = renderHook(() => useCups(false));

    expect(result.current).toEqual([]);
  });

  it('does not fetch when open=false', () => {
    renderHook(() => useCups(false));

    expect(mockFetchCups).not.toHaveBeenCalled();
  });

  it('fetches cups when open=true', async () => {
    mockFetchCups.mockResolvedValue([
      { id: 1, name: 'Kreispokal' },
      { id: 2, name: 'Stadtpokal' },
    ]);

    const { result } = renderHook(() => useCups(true));

    await waitFor(() => expect(result.current).toHaveLength(2));

    expect(mockFetchCups).toHaveBeenCalledTimes(1);
  });

  it('maps cups to SelectOption with value=String(id) and label=name', async () => {
    mockFetchCups.mockResolvedValue([
      { id: 7, name: 'DFB-Pokal' },
    ]);

    const { result } = renderHook(() => useCups(true));

    await waitFor(() => expect(result.current).toHaveLength(1));

    expect(result.current[0]).toEqual({ value: '7', label: 'DFB-Pokal' });
  });

  it('returns empty array when fetchCups resolves with []', async () => {
    mockFetchCups.mockResolvedValue([]);

    const { result } = renderHook(() => useCups(true));

    await waitFor(() => expect(mockFetchCups).toHaveBeenCalled());

    expect(result.current).toEqual([]);
  });

  it('re-fetches when open changes from false to true', async () => {
    mockFetchCups.mockResolvedValue([{ id: 3, name: 'Stadtpokal' }]);

    const { result, rerender } = renderHook(({ open }) => useCups(open), {
      initialProps: { open: false },
    });

    expect(mockFetchCups).not.toHaveBeenCalled();

    rerender({ open: true });

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(mockFetchCups).toHaveBeenCalledTimes(1);
  });
});
