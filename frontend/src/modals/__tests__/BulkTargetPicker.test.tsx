/**
 * Tests for BulkTargetPicker component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BulkTargetPicker } from '../messages/BulkTargetPicker';
import { OrgRef } from '../messages/types';

// ── MUI-Mocks ─────────────────────────────────────────────────────────────────

jest.mock('@mui/material/Autocomplete', () => ({
  __esModule: true,
  default: ({ renderInput, options, onChange, loading: _l, value: _v, getOptionLabel, noOptionsText: _not }: any) => (
    <div data-testid="autocomplete">
      {renderInput({ InputProps: {}, inputProps: {} })}
      {options.map((o: OrgRef) => (
        <button
          key={o.id}
          data-testid={`option-${o.id}`}
          onClick={() => onChange({} as React.SyntheticEvent, o)}
        >
          {typeof getOptionLabel === 'function' ? getOptionLabel(o) : o.name}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@mui/material/Box', () => ({ children, sx: _sx, ...p }: any) => <div {...p}>{children}</div>);
jest.mock('@mui/material/Chip', () => ({
  __esModule: true,
  default: ({ label, color, onClick, size: _s, variant: _v, ...p }: any) => (
    <span data-testid={`chip-${label}`} data-color={color} onClick={onClick} {...p}>
      {label}
    </span>
  ),
}));
jest.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel, size: _s }: any) => (
    <button onClick={onClick} aria-label={ariaLabel}>{children}</button>
  ),
}));
jest.mock('@mui/material/TextField', () => ({
  __esModule: true,
  default: ({ label, size: _s, fullWidth: _fw, ...p }: any) => (
    <input aria-label={label} data-testid={`textfield-${label}`} {...p} />
  ),
}));
jest.mock('@mui/material/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, sx: _sx, variant: _v, ...p }: any) => <span {...p}>{children}</span>,
}));
jest.mock('@mui/material/ToggleButtonGroup', () => ({
  __esModule: true,
  default: ({ children, sx: _sx, size: _s }: any) => <div>{children}</div>,
}));
jest.mock('@mui/material/ToggleButton', () => ({
  __esModule: true,
  default: ({ value, selected, onChange, children, sx: _sx, 'aria-label': ariaLabel }: any) => (
    <button
      data-testid={`toggle-${value}`}
      data-selected={selected ? 'true' : 'false'}
      aria-label={ariaLabel}
      onClick={onChange}
    >
      {children}
    </button>
  ),
}));

jest.mock('@mui/icons-material/Close', () => ({
  __esModule: true,
  default: ({ fontSize: _f }: any) => <span>x</span>,
}));
jest.mock('@mui/icons-material/Person', () => ({ __esModule: true, default: () => null }));
jest.mock('@mui/icons-material/School', () => ({ __esModule: true, default: () => null }));
jest.mock('@mui/icons-material/FamilyRestroom', () => ({ __esModule: true, default: () => null }));
jest.mock('@mui/icons-material/Groups', () => ({ __esModule: true, default: () => null }));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORGS: OrgRef[] = [
  { id: 't1', name: 'Team Blau' },
  { id: 't2', name: 'Team Rot' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BulkTargetPicker', () => {
  it('rendert Autocomplete mit verfügbaren Optionen', () => {
    render(
      <BulkTargetPicker label="Teams" orgs={ORGS} targets={[]} onChange={jest.fn()} />
    );
    expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('option-t1')).toBeInTheDocument();
    expect(screen.getByTestId('option-t2')).toBeInTheDocument();
  });

  it('schließt bereits gewählte Orgs aus den Optionen aus', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );
    expect(screen.queryByTestId('option-t1')).not.toBeInTheDocument();
    expect(screen.getByTestId('option-t2')).toBeInTheDocument();
  });

  it('ruft onChange mit neuem Target auf wenn Org ausgewählt wird', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker label="Teams" orgs={ORGS} targets={[]} onChange={onChange} />
    );
    fireEvent.click(screen.getByTestId('option-t1'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['all'] }]);
  });

  it('zeigt ToggleButtons für Rollen bei gewähltem Target', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByTestId('toggle-all')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-players')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-coaches')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-parents')).toBeInTheDocument();
  });

  it('markiert aktive Rolle als selected', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['players'] }]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByTestId('toggle-players')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('toggle-all')).toHaveAttribute('data-selected', 'false');
  });

  it('ruft onChange mit aktualisierter Rolle auf beim Klick auf ToggleButton', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={onChange}
      />
    );
    // Clicking 'coaches' when 'all' is active → deselects 'all', selects 'coaches'
    fireEvent.click(screen.getByTestId('toggle-coaches'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['coaches'] }]);
  });

  it('entfernt Target beim Klick auf Entfernen-Button', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }, { orgId: 't2', roles: ['players'] }]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Team Blau entfernen'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't2', roles: ['players'] }]);
  });

  it('zeigt org-Namen im Target-Label', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('Team Blau')).toBeInTheDocument();
  });

  it('zeigt orgId als Fallback wenn Org nicht im orgs-Array ist', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 'unknown-id', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('unknown-id')).toBeInTheDocument();
  });

  it('zeigt keine Targets wenn targets leer ist', () => {
    render(
      <BulkTargetPicker label="Teams" orgs={ORGS} targets={[]} onChange={jest.fn()} />
    );
    expect(screen.queryByTestId('toggle-all')).not.toBeInTheDocument();
  });
});

// ── aria-label Zugänglichkeit ─────────────────────────────────────────────────

describe('BulkTargetPicker – aria-label (Zugänglichkeit)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('alle Rollen-Buttons haben korrekte aria-label', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('toggle-players')).toHaveAttribute('aria-label', 'Spieler');
    expect(screen.getByTestId('toggle-coaches')).toHaveAttribute('aria-label', 'Trainer');
    expect(screen.getByTestId('toggle-parents')).toHaveAttribute('aria-label', 'Eltern');
    expect(screen.getByTestId('toggle-all')).toHaveAttribute('aria-label', 'Alle');
  });

  it('Entfernen-Button hat aria-label mit Org-Name', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Team Blau entfernen')).toBeInTheDocument();
  });

  it('Entfernen-Button nutzt orgId als Fallback wenn Org unbekannt', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 'unbekannte-id', roles: ['all'] }]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('unbekannte-id entfernen')).toBeInTheDocument();
  });

  it('jede Org hat ihren eigenen Entfernen-Button mit passendem aria-label', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[
          { orgId: 't1', roles: ['all'] },
          { orgId: 't2', roles: ['players'] },
        ]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Team Blau entfernen')).toBeInTheDocument();
    expect(screen.getByLabelText('Team Rot entfernen')).toBeInTheDocument();
  });
});

// ── toggleRole-Logik via Komponenten-Verhalten ────────────────────────────────

describe('BulkTargetPicker – toggleRole-Logik', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Klick auf "alle" setzt Rolle immer auf ["all"]', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['players'] }]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-all'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['all'] }]);
  });

  it('Klick auf "Spieler" wenn "Alle" aktiv → deselektiert "Alle", wählt "Spieler"', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['all'] }]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-players'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['players'] }]);
  });

  it('Klick auf weitere Rolle fügt sie zur bestehenden Auswahl hinzu', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['players'] }]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-coaches'));
    expect(onChange).toHaveBeenCalledWith([
      { orgId: 't1', roles: ['players', 'coaches'] },
    ]);
  });

  it('Klick auf aktive Rolle deselektiert sie', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['players', 'coaches'] }]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-players'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['coaches'] }]);
  });

  it('alle drei spezifischen Rollen gewählt → kollabiert automatisch zu ["all"]', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['players', 'coaches'] }]}
        onChange={onChange}
      />
    );

    // Hinzufügen von 'parents' macht alle 3 spezifischen Rollen aktiv → Kollaps zu 'all'
    fireEvent.click(screen.getByTestId('toggle-parents'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['all'] }]);
  });

  it('einzige aktive Rolle deselektieren → fällt zu ["all"] zurück', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[{ orgId: 't1', roles: ['coaches'] }]}
        onChange={onChange}
      />
    );

    // Deselektiert die einzige aktive Rolle → leerer Zustand → Fallback auf 'all'
    fireEvent.click(screen.getByTestId('toggle-coaches'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['all'] }]);
  });

  it('Rolle-Änderung betrifft nur die jeweilige Org, andere bleiben unberührt', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[
          { orgId: 't1', roles: ['all'] },
          { orgId: 't2', roles: ['players'] },
        ]}
        onChange={onChange}
      />
    );

    // Klick betrifft ersten ToggleButton der ersten Org (t1)
    const toggleButtons = screen.getAllByTestId('toggle-players');
    // t1 ist zuerst gelistet
    fireEvent.click(toggleButtons[0]);

    const result = onChange.mock.calls[0][0];
    // t1 ändert sich
    expect(result.find((t: any) => t.orgId === 't1').roles).toEqual(['players']);
    // t2 bleibt unverändert
    expect(result.find((t: any) => t.orgId === 't2').roles).toEqual(['players']);
  });
});

// ── Mehrere Targets ───────────────────────────────────────────────────────────

describe('BulkTargetPicker – mehrere Targets gleichzeitig', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rendert Rollen-Buttons für jede Org separat', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[
          { orgId: 't1', roles: ['all'] },
          { orgId: 't2', roles: ['coaches'] },
        ]}
        onChange={jest.fn()}
      />
    );

    // 4 Buttons pro Org = 8 insgesamt
    expect(screen.getAllByTestId('toggle-all')).toHaveLength(2);
    expect(screen.getAllByTestId('toggle-players')).toHaveLength(2);
    expect(screen.getAllByTestId('toggle-coaches')).toHaveLength(2);
    expect(screen.getAllByTestId('toggle-parents')).toHaveLength(2);
  });

  it('markiert pro Org die richtigen Rollen als aktiv', () => {
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[
          { orgId: 't1', roles: ['all'] },
          { orgId: 't2', roles: ['coaches'] },
        ]}
        onChange={jest.fn()}
      />
    );

    const allButtons     = screen.getAllByTestId('toggle-all');
    const coachesButtons = screen.getAllByTestId('toggle-coaches');

    // t1: 'all' aktiv, 'coaches' nicht aktiv
    expect(allButtons[0]).toHaveAttribute('data-selected', 'true');
    expect(coachesButtons[0]).toHaveAttribute('data-selected', 'false');

    // t2: 'all' nicht aktiv, 'coaches' aktiv
    expect(allButtons[1]).toHaveAttribute('data-selected', 'false');
    expect(coachesButtons[1]).toHaveAttribute('data-selected', 'true');
  });

  it('entfernt korrekte Org auch wenn mehrere Targets vorhanden', () => {
    const onChange = jest.fn();
    render(
      <BulkTargetPicker
        label="Teams"
        orgs={ORGS}
        targets={[
          { orgId: 't1', roles: ['all'] },
          { orgId: 't2', roles: ['players'] },
        ]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Team Rot entfernen'));
    expect(onChange).toHaveBeenCalledWith([{ orgId: 't1', roles: ['all'] }]);
  });
});

