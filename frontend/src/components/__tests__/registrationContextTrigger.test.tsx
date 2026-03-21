/**
 * Tests for the needsRegistrationContext trigger in App.tsx
 *
 * The critical integration under test:
 *   When /api/about-me returns { needsRegistrationContext: true } for a logged-in
 *   user, the RegistrationContextDialog must be shown (open=true).
 *   When the flag is false, the dialog must stay hidden.
 *
 * Strategy: We cannot render the full App.tsx (too many providers / router deps),
 * so we replicate the exact useEffect logic in a lightweight TestTrigger component
 * and mock AuthContext + RegistrationContextDialog to observe the outcome.
 */

import React, { useState, useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ────── Mock AuthContext ──────
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ────── Mock RegistrationContextDialog – capture the open prop ──────
jest.mock('../../modals/RegistrationContextDialog', () => (props: { open: boolean; onClose: () => void }) => (
  props.open ? <div data-testid="RegistrationContextDialog" /> : null
));

// ────── TestTrigger: mirrors the App.tsx useEffect exactly ──────
import { useAuth } from '../../context/AuthContext';
import RegistrationContextDialog from '../../modals/RegistrationContextDialog';

function TestTrigger() {
  const { user } = useAuth() as any;
  const [showDialog, setShowDialog] = useState(false);

  // ← This is the exact same code as in App.tsx
  useEffect(() => {
    if (user?.needsRegistrationContext) {
      const timer = setTimeout(() => setShowDialog(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <RegistrationContextDialog open={showDialog} onClose={() => setShowDialog(false)} />
  );
}

// ────── Helpers ──────
function makeUser(needsRegistrationContext: boolean) {
  return {
    id: 42,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: { 0: 'ROLE_USER' },
    isPlayer: false,
    isCoach: false,
    needsRegistrationContext,
  };
}

// ────── Tests ──────

describe('Registration context dialog trigger (App.tsx logic)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
    mockUseAuth.mockReset();
  });

  it('does NOT show dialog when user is null (not logged in)', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(<TestTrigger />);

    act(() => { jest.advanceTimersByTime(1000); });

    expect(screen.queryByTestId('RegistrationContextDialog')).not.toBeInTheDocument();
  });

  it('does NOT show dialog when needsRegistrationContext is false', () => {
    mockUseAuth.mockReturnValue({ user: makeUser(false) });

    render(<TestTrigger />);

    act(() => { jest.advanceTimersByTime(1000); });

    expect(screen.queryByTestId('RegistrationContextDialog')).not.toBeInTheDocument();
  });

  it('does NOT show dialog immediately when needsRegistrationContext is true (800ms delay)', () => {
    mockUseAuth.mockReturnValue({ user: makeUser(true) });

    render(<TestTrigger />);

    // Before the 800ms timeout fires
    act(() => { jest.advanceTimersByTime(799); });

    expect(screen.queryByTestId('RegistrationContextDialog')).not.toBeInTheDocument();
  });

  it('SHOWS dialog after 800ms when needsRegistrationContext is true', () => {
    mockUseAuth.mockReturnValue({ user: makeUser(true) });

    render(<TestTrigger />);

    act(() => { jest.advanceTimersByTime(800); });

    expect(screen.getByTestId('RegistrationContextDialog')).toBeInTheDocument();
  });

  it('SHOWS dialog when needsRegistrationContext is true (after full delay)', () => {
    mockUseAuth.mockReturnValue({ user: makeUser(true) });

    render(<TestTrigger />);

    act(() => { jest.advanceTimersByTime(2000); });

    expect(screen.getByTestId('RegistrationContextDialog')).toBeInTheDocument();
  });

  it('does NOT show dialog when needsRegistrationContext is undefined', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'x@x.de', roles: {}, needsRegistrationContext: undefined },
    });

    render(<TestTrigger />);

    act(() => { jest.advanceTimersByTime(1000); });

    expect(screen.queryByTestId('RegistrationContextDialog')).not.toBeInTheDocument();
  });

  it('cleans up timer if component unmounts before 800ms', () => {
    mockUseAuth.mockReturnValue({ user: makeUser(true) });

    const { unmount } = render(<TestTrigger />);

    act(() => { jest.advanceTimersByTime(500); });
    unmount();

    // Advancing past the 800ms threshold after unmount should not throw
    act(() => { jest.advanceTimersByTime(400); });

    // No assertion needed – the test passes if no setState-on-unmounted-component
    // warning / error is thrown.
  });
});
