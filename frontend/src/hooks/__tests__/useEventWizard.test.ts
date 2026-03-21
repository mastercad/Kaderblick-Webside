import { renderHook, act } from '@testing-library/react';
import { useEventWizard } from '../useEventWizard';

// Mock useEventTypeFlags so we can control flags without depending on SelectOption data
jest.mock('../useEventTypeFlags', () => ({
  useEventTypeFlags: (_eventType: string, _gameType: string) => ({
    isMatchEvent:         _eventType === 'spiel',
    isTournament:         _eventType === 'turnier',
    isTournamentEventType:_eventType === 'turnier',
    isTask:               _eventType === 'aufgabe',
    isTraining:           _eventType === 'training',
    isGenericEvent:       !['spiel', 'turnier', 'aufgabe', 'training'].includes(_eventType),
  }),
}));

const baseEvent = {
  title: 'Test Event',
  eventType: 'training',
  date: '2026-03-12',
};

const makeParams = (overrides: Record<string, any> = {}) => ({
  open: true,
  event: { ...baseEvent, ...overrides },
  eventTypes: [{ value: 'training', label: 'Training' }],
  gameTypes:  [],
  onChange: jest.fn(),
  onSave:   jest.fn(),
  onClose:  jest.fn(),
});

describe('useEventWizard', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Step list ─────────────────────────────────────────────────────────────

  it('starts on step 0', () => {
    const { result } = renderHook(() => useEventWizard(makeParams()));
    expect(result.current.currentStep).toBe(0);
  });

  it('training event has 3 steps: Basisdaten, Training, Beschreibung', () => {
    const { result } = renderHook(() =>
      useEventWizard(makeParams({ eventType: 'training' })),
    );
    expect(result.current.steps.map(s => s.key)).toEqual(['base', 'details', 'description']);
    expect(result.current.steps[1].label).toBe('Training');
  });

  it('aufgabe event has 3 steps: Basisdaten, Aufgabe, Beschreibung', () => {
    const { result } = renderHook(() =>
      useEventWizard(makeParams({ eventType: 'aufgabe' })),
    );
    expect(result.current.steps.map(s => s.key)).toEqual(['base', 'details', 'description']);
    expect(result.current.steps[1].label).toBe('Aufgabe');
  });

  it('spiel event has 4 steps: Basisdaten, Spieldetails, Spielzeiten, Beschreibung', () => {
    const { result } = renderHook(() =>
      useEventWizard(makeParams({ eventType: 'spiel' })),
    );
    expect(result.current.steps.map(s => s.key)).toEqual(['base', 'details', 'timing', 'description']);
    expect(result.current.steps[1].label).toBe('Spieldetails');
    expect(result.current.steps[2].label).toBe('Spielzeiten');
  });

  it('turnier event has 4 steps incl. Begegnungen but not Spielzeiten', () => {
    const { result } = renderHook(() =>
      useEventWizard(makeParams({ eventType: 'turnier' })),
    );
    expect(result.current.steps.map(s => s.key)).toEqual(['base', 'details', 'matches', 'description']);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('handleNext advances to next step when valid', () => {
    const { result } = renderHook(() => useEventWizard(makeParams()));
    act(() => { result.current.handleNext(); });
    expect(result.current.currentStep).toBe(1);
  });

  it('handleBack does not go below 0', () => {
    const { result } = renderHook(() => useEventWizard(makeParams()));
    act(() => { result.current.handleBack(); });
    expect(result.current.currentStep).toBe(0);
  });

  it('handleBack decrements step', () => {
    const { result } = renderHook(() => useEventWizard(makeParams()));
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleBack(); });
    expect(result.current.currentStep).toBe(0);
  });

  it('isLastStep is true on final step', () => {
    const { result } = renderHook(() => useEventWizard(makeParams()));
    // Navigate to last step (index 2 for training)
    act(() => { result.current.handleNext(); }); // 0 → 1
    act(() => { result.current.handleNext(); }); // 1 → 2
    expect(result.current.isLastStep).toBe(true);
  });

  // ── Validation – base step ─────────────────────────────────────────────────

  it('handleNext sets stepError when title is missing on step 0', () => {
    const params = makeParams({ title: '', eventType: 'training', date: '2026-03-12' });
    const { result } = renderHook(() => useEventWizard(params));
    act(() => { result.current.handleNext(); });
    expect(result.current.stepError).toBeTruthy();
    expect(result.current.currentStep).toBe(0);
  });

  it('handleNext sets stepError when date is missing on step 0', () => {
    const params = makeParams({ title: 'T', eventType: 'training', date: '' });
    const { result } = renderHook(() => useEventWizard(params));
    act(() => { result.current.handleNext(); });
    expect(result.current.stepError).toBeTruthy();
  });

  it('handleBack clears stepError', () => {
    const params = makeParams({ title: '' });
    const { result } = renderHook(() => useEventWizard(params));
    act(() => { result.current.handleNext(); }); // triggers error
    act(() => { result.current.handleBack(); });  // should clear
    expect(result.current.stepError).toBeNull();
  });

  // ── Validation – task details step ───────────────────────────────────────

  it('handleNext sets error when task has no rotation users', () => {
    const params = makeParams({ eventType: 'aufgabe', taskRotationUsers: [], taskRotationCount: 1 });
    const { result } = renderHook(() => useEventWizard(params));
    // advance to details step (step 1)
    act(() => { result.current.handleNext(); }); // base → details
    act(() => { result.current.handleNext(); }); // attempt details → description
    expect(result.current.stepError).toBeTruthy();
    expect(result.current.currentStep).toBe(1);
  });

  // ── Reset on open ─────────────────────────────────────────────────────────

  it('resets currentStep to 0 when open changes to true', () => {
    const params = makeParams();
    const { result, rerender } = renderHook(
      ({ p }: { p: ReturnType<typeof makeParams> }) => useEventWizard(p),
      { initialProps: { p: { ...params, open: false } } },
    );
    // manually advance
    act(() => { result.current.handleNext(); });
    // re-open
    rerender({ p: { ...params, open: true } });
    expect(result.current.currentStep).toBe(0);
  });

  // ── handleSave ────────────────────────────────────────────────────────────

  it('handleSave calls onSave with event data when validation passes', () => {
    const onSave = jest.fn();
    const params = { ...makeParams(), onSave };
    const { result } = renderHook(() => useEventWizard(params));
    // Navigate to last step
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleSave(); });
    expect(onSave).toHaveBeenCalledWith(params.event);
  });

  // ── handleClose ───────────────────────────────────────────────────────────

  it('handleClose calls onClose', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useEventWizard({ ...makeParams(), onClose }));
    act(() => { result.current.handleClose(); });
    expect(onClose).toHaveBeenCalled();
  });
});
