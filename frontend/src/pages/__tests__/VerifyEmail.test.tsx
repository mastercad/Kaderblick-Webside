/**
 * Tests for the VerifyEmail page.
 *
 * Covers: loading state, successful verification (success screen + message),
 * error state on API failure, error state when token is missing.
 *
 * Strategy: real MUI components + accessibility queries. Icons mocked with
 * a stable data-testid for icon assertions.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Icon mocks ──────────────────────────────────────────────────────────────
jest.mock('@mui/icons-material/CheckCircle', () => () => <span data-testid="CheckCircleIcon" />);
jest.mock('@mui/icons-material/Error',       () => () => <span data-testid="ErrorIcon" />);

// ─── react-router-dom mock ───────────────────────────────────────────────────

const mockNavigate  = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams:   () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

// ─── API mock ─────────────────────────────────────────────────────────────────

const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

// ─────────────────────────────────────────────────────────────────────────────

import VerifyEmail from '../VerifyEmail';

beforeEach(() => {
  mockApiJson.mockReset();
  mockNavigate.mockReset();
  mockUseParams.mockReturnValue({ token: 'abc123token' });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VerifyEmail', () => {
  it('shows a loading spinner while the API call is in progress', () => {
    // Never-resolving promise → stays in loading state
    mockApiJson.mockReturnValue(new Promise(() => {}));

    render(<VerifyEmail />);

    expect(screen.getByText(/wird verifiziert/i)).toBeInTheDocument();
  });

  it('shows the success screen after successful verification', async () => {
    mockApiJson.mockResolvedValue({
      message: 'Deine E-Mail-Adresse wurde erfolgreich verifiziert. Du kannst dich jetzt anmelden.',
    });

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
      // Heading contains "Erfolgreich verifiziert!"
      expect(screen.getByRole('heading', { name: /Erfolgreich verifiziert/i })).toBeInTheDocument();
    });

    // Success screen has two Alerts (success message + info tip); the first is the success one
    const alerts = screen.getAllByRole('alert');
    expect(alerts[0]).toHaveTextContent(/erfolgreich verifiziert/i);
  });

  it('shows the error screen when the API returns { error }', async () => {
    mockApiJson.mockResolvedValue({
      error: 'Der Verifizierungslink ist ungültig oder abgelaufen.',
    });

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
      expect(screen.getByText(/fehlgeschlagen/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/ungültig oder abgelaufen/i);
  });

  it('shows an error screen when the API call throws', async () => {
    mockApiJson.mockRejectedValue(new Error('Network error'));

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/fehlgeschlagen/i);
  });

  it('shows an error without calling the API when the token is missing', async () => {
    mockUseParams.mockReturnValue({ token: undefined });

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    expect(mockApiJson).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/kein verifizierungstoken/i);
  });

  it('calls GET /api/verify-email/{token} with the URL token', async () => {
    mockApiJson.mockResolvedValue({ message: 'OK' });
    mockUseParams.mockReturnValue({ token: 'my-unique-token-xyz' });

    render(<VerifyEmail />);

    await waitFor(() => {
      expect(mockApiJson).toHaveBeenCalledWith(
        '/api/verify-email/my-unique-token-xyz',
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });
});
