import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CancelDialog } from '../dialogs/CancelDialog';

describe('CancelDialog', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    reason: '',
    onReasonChange: jest.fn(),
    cancelling: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<CancelDialog {...baseProps} open={false} />);
    expect(screen.queryByText(/Event absagen/)).not.toBeInTheDocument();
  });

  it('renders dialog title', () => {
    render(<CancelDialog {...baseProps} />);
    expect(screen.getByText('Event absagen')).toBeInTheDocument();
  });

  it('renders the reason text field', () => {
    render(<CancelDialog {...baseProps} />);
    expect(screen.getByLabelText(/Grund der Absage/i)).toBeInTheDocument();
  });

  it('shows current reason in textarea', () => {
    render(<CancelDialog {...baseProps} reason="Krank" />);
    expect(screen.getByDisplayValue('Krank')).toBeInTheDocument();
  });

  it('calls onReasonChange when typing', () => {
    render(<CancelDialog {...baseProps} />);
    const textarea = screen.getByLabelText(/Grund der Absage/i);
    fireEvent.change(textarea, { target: { value: 'Schlechtes Wetter' } });
    expect(baseProps.onReasonChange).toHaveBeenCalledWith('Schlechtes Wetter');
  });

  it('calls onClose when Abbrechen is clicked', () => {
    render(<CancelDialog {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('Absagen button is disabled when reason is empty', () => {
    render(<CancelDialog {...baseProps} reason="" />);
    const absagenBtn = screen.getByRole('button', { name: /absagen/i });
    expect(absagenBtn).toBeDisabled();
  });

  it('Absagen button is disabled when reason is only whitespace', () => {
    render(<CancelDialog {...baseProps} reason="   " />);
    const absagenBtn = screen.getByRole('button', { name: /absagen/i });
    expect(absagenBtn).toBeDisabled();
  });

  it('Absagen button is enabled when reason has content', () => {
    render(<CancelDialog {...baseProps} reason="Krank" />);
    const absagenBtn = screen.getByRole('button', { name: /absagen/i });
    expect(absagenBtn).not.toBeDisabled();
  });

  it('calls onConfirm when Absagen is clicked', () => {
    render(<CancelDialog {...baseProps} reason="Krank" />);
    fireEvent.click(screen.getByRole('button', { name: /absagen/i }));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while cancelling', () => {
    render(<CancelDialog {...baseProps} reason="Krank" cancelling={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('shows "Wird abgesagt…" text while cancelling', () => {
    render(<CancelDialog {...baseProps} reason="Krank" cancelling={true} />);
    expect(screen.getByText('Wird abgesagt…')).toBeInTheDocument();
  });
});
