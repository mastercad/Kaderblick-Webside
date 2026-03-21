import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NoteDialog } from '../dialogs/NoteDialog';
import type { ParticipationStatus } from '../types';

// NoteDialog uses useMediaQuery → matchMedia must be mocked
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

const STATUS: ParticipationStatus = {
  id: 1,
  name: 'Zugesagt',
  code: 'yes',
  color: '#4caf50',
  sort_order: 1,
};

describe('NoteDialog', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    pendingStatus: STATUS,
    note: '',
    onNoteChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render content when closed', () => {
    render(<NoteDialog {...baseProps} open={false} />);
    expect(screen.queryByText('Zugesagt')).not.toBeInTheDocument();
  });

  it('renders status name in the dialog title', () => {
    render(<NoteDialog {...baseProps} />);
    expect(screen.getByText('Zugesagt')).toBeInTheDocument();
  });

  it('shows fallback title when pendingStatus is undefined', () => {
    render(<NoteDialog {...baseProps} pendingStatus={undefined} />);
    expect(screen.getByText('Rückmeldung')).toBeInTheDocument();
  });

  it('calls onClose when Abbrechen is clicked', () => {
    render(<NoteDialog {...baseProps} />);
    const cancelBtn = screen.getByRole('button', { name: /abbrechen/i });
    fireEvent.click(cancelBtn);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Bestätigen is clicked', () => {
    render(<NoteDialog {...baseProps} />);
    const saveBtn = screen.getByRole('button', { name: /bestätigen/i });
    fireEvent.click(saveBtn);
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onNoteChange when textarea value changes', () => {
    render(<NoteDialog {...baseProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Bin etwas später' } });
    expect(baseProps.onNoteChange).toHaveBeenCalledWith('Bin etwas später');
  });

  it('renders current note value in textarea', () => {
    render(<NoteDialog {...baseProps} note="Aktuelle Notiz" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Aktuelle Notiz');
  });
});
