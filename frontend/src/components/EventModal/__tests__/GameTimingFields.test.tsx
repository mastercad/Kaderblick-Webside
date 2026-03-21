import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameTimingFields } from '../GameTimingFields';
import { EventData } from '../../../types/event';

// ── MUI mocks ──────────────────────────────────────────────────────────────
jest.mock('@mui/material/Box', () => (props: any) => <div>{props.children}</div>);
jest.mock('@mui/material/Typography', () => (props: any) => <span data-variant={props.variant}>{props.children}</span>);
jest.mock('@mui/material/Chip', () => (props: any) => <span data-testid="chip">{props.label}</span>);
jest.mock('@mui/icons-material/InfoOutlined', () => () => <span data-testid="InfoIcon" />);
jest.mock('@mui/material/TextField', () => (props: any) => (
  <div>
    <label htmlFor={props.label}>{props.label}</label>
    <input
      data-testid={props.label}
      type={props.type || 'text'}
      value={props.value != null ? String(props.value) : ''}
      placeholder={props.placeholder}
      onChange={e => props.onChange?.(e)}
    />
    {props.helperText && <small>{props.helperText}</small>}
  </div>
));

// ── Helpers ────────────────────────────────────────────────────────────────
const makeProps = (formData: Partial<EventData> = {}, extras: Record<string, any> = {}) => ({
  formData: { title: 'Testspiel', date: '2025-06-01', ...formData } as EventData,
  onChange: jest.fn(),
  ...extras,
});

describe('GameTimingFields', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Default render ─────────────────────────────────────────────────────────

  it('renders half duration and halftime break inputs', () => {
    render(<GameTimingFields {...makeProps()} />);
    expect(screen.getByTestId('Halbzeit-Dauer (Min.)')).toBeInTheDocument();
    expect(screen.getByTestId('Halbzeit-Pause (Min.)')).toBeInTheDocument();
  });

  it('renders extra time inputs', () => {
    render(<GameTimingFields {...makeProps()} />);
    expect(screen.getByTestId('Nachspielzeit 1. Halbzeit (Min.)')).toBeInTheDocument();
    expect(screen.getByTestId('Nachspielzeit 2. Halbzeit (Min.)')).toBeInTheDocument();
  });

  it('shows fallback default value hint 45 when no team default', () => {
    render(<GameTimingFields {...makeProps()} />);
    expect(screen.getByText('Standard: 45 Min. pro Halbzeit')).toBeInTheDocument();
    expect(screen.getByText('Standard: 15 Min. Pause')).toBeInTheDocument();
  });

  // ── Pre-filled values ─────────────────────────────────────────────────────

  it('uses formData timing values when already set', () => {
    render(
      <GameTimingFields
        {...makeProps({ gameHalfDuration: 40, gameHalftimeBreakDuration: 10 })}
      />,
    );
    const halfInput = screen.getByTestId('Halbzeit-Dauer (Min.)') as HTMLInputElement;
    expect(halfInput.value).toBe('40');
  });

  // ── Team defaults hint ────────────────────────────────────────────────────

  it('shows team default chips when teamDefaultHalfDuration is provided', () => {
    render(
      <GameTimingFields
        {...makeProps()}
        teamDefaultHalfDuration={35}
        teamDefaultHalftimeBreakDuration={12}
      />,
    );
    const chips = screen.getAllByTestId('chip');
    expect(chips.length).toBeGreaterThan(0);
    const chipTexts = chips.map(c => c.textContent).join(' ');
    expect(chipTexts).toContain('35');
    expect(chipTexts).toContain('12');
  });

  it('does not show team default chips when no team defaults', () => {
    render(<GameTimingFields {...makeProps()} />);
    expect(screen.queryByTestId('chip')).toBeNull();
  });

  // ── Calculated game duration ──────────────────────────────────────────────

  it('shows correct calculated game duration with defaults (45+15+45 = 105 min)', () => {
    render(
      <GameTimingFields
        {...makeProps({ gameHalfDuration: 45, gameHalftimeBreakDuration: 15 })}
      />,
    );
    expect(screen.getByText(/105 Min\./)).toBeInTheDocument();
  });

  it('shows updated calculated game duration when custom values are set', () => {
    render(
      <GameTimingFields
        {...makeProps({ gameHalfDuration: 30, gameHalftimeBreakDuration: 10 })}
      />,
    );
    // 30+10+30 = 70 min
    expect(screen.getByText(/70 Min\./)).toBeInTheDocument();
  });

  // ── onChange forwarding ───────────────────────────────────────────────────

  it('calls onChange with gameHalfDuration when input changes', () => {
    const onChange = jest.fn();
    render(
      <GameTimingFields
        {...makeProps({ gameHalfDuration: 45 })}
        onChange={onChange}
      />,
    );
    const input = screen.getByTestId('Halbzeit-Dauer (Min.)');
    fireEvent.change(input, { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith('gameHalfDuration', expect.anything());
  });

  it('calls onChange with gameHalftimeBreakDuration when input changes', () => {
    const onChange = jest.fn();
    render(
      <GameTimingFields
        {...makeProps({ gameHalftimeBreakDuration: 15 })}
        onChange={onChange}
      />,
    );
    const input = screen.getByTestId('Halbzeit-Pause (Min.)');
    fireEvent.change(input, { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith('gameHalftimeBreakDuration', expect.anything());
  });
});
