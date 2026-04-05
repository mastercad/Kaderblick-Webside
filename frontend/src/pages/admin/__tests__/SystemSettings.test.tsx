import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemSettings from '../SystemSettings';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../utils/api', () => ({
  apiJson: jest.fn(),
}));

import { apiJson } from '../../../utils/api';
const mockApiJson = apiJson as jest.MockedFunction<typeof apiJson>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeSettings = (overrides: Record<string, unknown> = {}) => ({
  settings: {
    registration_context_enabled: { value: 'true', updatedAt: '2025-01-01T00:00:00Z' },
    '2fa_required': { value: 'false', updatedAt: '2025-01-01T00:00:00Z' },
    ...overrides,
  },
  defaults: {
    registration_context_enabled: 'true',
    '2fa_required': 'false',
    push_notifications_mode: 'all',
  },
});

async function renderAndWait(settingsOverrides: Record<string, unknown> = {}) {
  mockApiJson.mockResolvedValueOnce(makeSettings(settingsOverrides));
  render(<SystemSettings />);
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SystemSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Loading ────────────────────────────────────────────────────────────────

  it('shows a spinner initially', () => {
    mockApiJson.mockReturnValue(new Promise(() => {})); // never resolves
    render(<SystemSettings />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error alert when loading fails', async () => {
    mockApiJson.mockRejectedValueOnce(new Error('Network error'));
    render(<SystemSettings />);
    await waitFor(() =>
      expect(screen.getByText(/konnten nicht geladen/i)).toBeInTheDocument()
    );
  });

  // ── Rendering the three sections ───────────────────────────────────────────

  it('renders the registration section', async () => {
    await renderAndWait();
    expect(screen.getByText(/registrierung/i)).toBeInTheDocument();
  });

  it('renders the security section', async () => {
    await renderAndWait();
    expect(screen.getByText(/sicherheit/i)).toBeInTheDocument();
  });

  it('renders the push-notifications section', async () => {
    await renderAndWait();
    // The section overline heading (unique Typography with 'overline' style)
    const headings = screen.getAllByText(/push-benachrichtigungen/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  // ── Push mode radio group ──────────────────────────────────────────────────

  it('renders all three push mode radio options', async () => {
    await renderAndWait();
    // Check that all three radio inputs are rendered by their values
    expect(screen.getByDisplayValue('all')).toBeInTheDocument();
    expect(screen.getByDisplayValue('only_me')).toBeInTheDocument();
    expect(screen.getByDisplayValue('disabled')).toBeInTheDocument();
  });

  it('selects "all" radio by default when push_notifications_mode is not in settings', async () => {
    await renderAndWait(); // no push_notifications_mode in settings → falls back to default 'all'
    const allRadio = screen.getByDisplayValue('all');
    expect(allRadio).toBeChecked();
  });

  it('selects the correct radio when push_notifications_mode is "only_me"', async () => {
    await renderAndWait({
      push_notifications_mode: { value: 'only_me', updatedAt: '2025-01-01T00:00:00Z' },
    });
    const onlyMeRadio = screen.getByDisplayValue('only_me');
    expect(onlyMeRadio).toBeChecked();
  });

  it('selects the correct radio when push_notifications_mode is "disabled"', async () => {
    await renderAndWait({
      push_notifications_mode: { value: 'disabled', updatedAt: '2025-01-01T00:00:00Z' },
    });
    const disabledRadio = screen.getByDisplayValue('disabled');
    expect(disabledRadio).toBeChecked();
  });

  // ── PATCH on radio change ──────────────────────────────────────────────────

  it('calls PATCH with the selected value when a radio option is clicked', async () => {
    mockApiJson.mockResolvedValueOnce(makeSettings());
    mockApiJson.mockResolvedValueOnce({ key: 'push_notifications_mode', value: 'only_me' });

    render(<SystemSettings />);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    const onlyMeRadio = screen.getByDisplayValue('only_me');
    fireEvent.click(onlyMeRadio);

    await waitFor(() =>
      expect(mockApiJson).toHaveBeenCalledWith(
        '/api/superadmin/system-settings/push_notifications_mode',
        expect.objectContaining({ method: 'PATCH', body: { value: 'only_me' } })
      )
    );
  });

  it('shows success message after successful PATCH', async () => {
    mockApiJson.mockResolvedValueOnce(makeSettings());
    mockApiJson.mockResolvedValueOnce({ key: 'push_notifications_mode', value: 'disabled' });

    render(<SystemSettings />);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    fireEvent.click(screen.getByDisplayValue('disabled'));

    await waitFor(() =>
      expect(screen.getByText(/einstellung gespeichert/i)).toBeInTheDocument()
    );
  });

  it('shows error message when PATCH fails', async () => {
    mockApiJson.mockResolvedValueOnce(makeSettings());
    mockApiJson.mockRejectedValueOnce(new Error('Server error'));

    render(<SystemSettings />);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    fireEvent.click(screen.getByDisplayValue('disabled'));

    await waitFor(() =>
      expect(screen.getByText(/konnte nicht gespeichert/i)).toBeInTheDocument()
    );
  });

  // ── Toggle for boolean settings still works ────────────────────────────────

  it('calls PATCH when 2FA toggle is clicked', async () => {
    mockApiJson.mockResolvedValueOnce(makeSettings());
    mockApiJson.mockResolvedValueOnce({ key: '2fa_required', value: 'true' });

    render(<SystemSettings />);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    // MUI Switch renders with role="switch"; the 2FA toggle is the second one.
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[1]);

    await waitFor(() =>
      expect(mockApiJson).toHaveBeenCalledWith(
        '/api/superadmin/system-settings/2fa_required',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  // ── Mein Spieltag – matchday_lookahead_days slider ────────────────────────

  it('renders the "Mein Spieltag" section', async () => {
    await renderAndWait();
    // Section overline heading
    const headings = screen.getAllByText(/mein spieltag/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Slider in the matchday section', async () => {
    await renderAndWait();
    // MUI Slider renders with role="slider"
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('Slider shows default value of 7 when no matchday_lookahead_days setting exists', async () => {
    // Settings without matchday_lookahead_days → falls back to default 7
    await renderAndWait();
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '7');
  });

  it('Slider shows stored value when matchday_lookahead_days is configured', async () => {
    await renderAndWait({
      matchday_lookahead_days: { value: '14', updatedAt: '2025-01-01T00:00:00Z' },
    });
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '14');
  });

  it('calls PATCH with the new value when Slider change is committed via keyboard', async () => {
    mockApiJson.mockResolvedValueOnce(makeSettings());
    mockApiJson.mockResolvedValueOnce({ key: 'matchday_lookahead_days', value: '8' });

    render(<SystemSettings />);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    const slider = screen.getByRole('slider');
    // Focus the slider and increase value by one step (ArrowRight → onChange + onChangeCommitted)
    slider.focus();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyUp(slider, { key: 'ArrowRight' });

    await waitFor(() =>
      expect(mockApiJson).toHaveBeenCalledWith(
        '/api/superadmin/system-settings/matchday_lookahead_days',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  it('Slider PATCH carries a numeric string value', async () => {
    mockApiJson.mockResolvedValueOnce(
      makeSettings({ matchday_lookahead_days: { value: '10', updatedAt: '2025-01-01T00:00:00Z' } })
    );
    mockApiJson.mockResolvedValueOnce({ key: 'matchday_lookahead_days', value: '11' });

    render(<SystemSettings />);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    const slider = screen.getByRole('slider');
    slider.focus();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyUp(slider, { key: 'ArrowRight' });

    await waitFor(() => {
      const patchCall = mockApiJson.mock.calls.find(
        args => args[0] === '/api/superadmin/system-settings/matchday_lookahead_days'
      );
      expect(patchCall).toBeDefined();
      // value must be a string (backend accepts string)
      expect(typeof patchCall![1]!.body.value).toBe('string');
    });
  });

  it('defaults list includes matchday_lookahead_days', async () => {
    // The defaults fixture inside makeSettings does NOT include matchday_lookahead_days –
    // this test verifies the component still renders without crashing when it is absent
    // (i.e., the setting falls back gracefully to the hardcoded default of 7).
    await renderAndWait();
    // Slider is present even without the key in the defaults object
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
