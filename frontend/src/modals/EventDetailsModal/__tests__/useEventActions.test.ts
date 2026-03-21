import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useEventActions } from '../hooks/useEventActions';

const mockApiRequest = jest.fn();
jest.mock('../../../utils/api', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

// Prevent alert from throwing in jsdom
beforeAll(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('useEventActions', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  describe('cancelEvent', () => {
    it('returns false without reason', async () => {
      const { result } = renderHook(() => useEventActions(5));
      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.cancelEvent('');
      });
      expect(ret).toBe(false);
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('returns false when eventId is undefined', async () => {
      const { result } = renderHook(() => useEventActions(undefined));
      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.cancelEvent('Krank');
      });
      expect(ret).toBe(false);
      expect(mockApiRequest).not.toHaveBeenCalled();
    });

    it('calls PATCH endpoint with trimmed reason on success', async () => {
      mockApiRequest.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

      const onCancelled = jest.fn();
      const onClose = jest.fn();
      const { result } = renderHook(() => useEventActions(7, onCancelled, onClose));

      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.cancelEvent('  Abgesagt  ');
      });

      expect(ret).toBe(true);
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/calendar/event/7/cancel',
        { method: 'PATCH', body: { reason: 'Abgesagt' } },
      );
      expect(onCancelled).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(result.current.cancelling).toBe(false);
    });

    it('returns false and shows alert when API returns not ok', async () => {
      mockApiRequest.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Kein Zugriff' }),
      });

      const { result } = renderHook(() => useEventActions(7));
      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.cancelEvent('Krank');
      });

      expect(ret).toBe(false);
      expect(window.alert).toHaveBeenCalledWith('Kein Zugriff');
    });

    it('returns false and shows alert on network error', async () => {
      mockApiRequest.mockRejectedValue(new Error('timeout'));

      const { result } = renderHook(() => useEventActions(7));
      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.cancelEvent('Krank');
      });

      expect(ret).toBe(false);
      expect(window.alert).toHaveBeenCalledWith('Fehler beim Absagen.');
    });
  });

  describe('reactivateEvent', () => {
    it('returns false when eventId is undefined', async () => {
      const { result } = renderHook(() => useEventActions(undefined));
      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.reactivateEvent();
      });
      expect(ret).toBe(false);
    });

    it('calls PATCH reactivate endpoint on success', async () => {
      mockApiRequest.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

      const onCancelled = jest.fn();
      const onClose = jest.fn();
      const { result } = renderHook(() => useEventActions(3, onCancelled, onClose));

      let ret: boolean | undefined;
      await act(async () => {
        ret = await result.current.reactivateEvent();
      });

      expect(ret).toBe(true);
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/calendar/event/3/reactivate',
        { method: 'PATCH' },
      );
      expect(onCancelled).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(result.current.reactivating).toBe(false);
    });
  });
});
