import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CupDeleteConfirmationModal } from '../CupDeleteConfirmationModal';

// ── Mock ConfirmationModal to isolate the wrapper under test ───────────────
const mockConfirmationModal = jest.fn();
jest.mock('../ConfirmationModal', () => ({
  ConfirmationModal: (props: any) => {
    mockConfirmationModal(props);
    if (!props.open) return null;
    return (
      <div data-testid="ConfirmationModal">
        <span data-testid="modal-title">{props.title}</span>
        <span data-testid="modal-message">{props.message}</span>
        <button data-testid="btn-confirm" onClick={props.onConfirm}>
          {props.confirmText}
        </button>
        <button data-testid="btn-cancel" onClick={props.onClose}>
          Abbrechen
        </button>
      </div>
    );
  },
}));

const baseProps = {
  open: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

describe('CupDeleteConfirmationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders when open=true', () => {
    render(<CupDeleteConfirmationModal {...baseProps} />);
    expect(screen.getByTestId('ConfirmationModal')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    render(<CupDeleteConfirmationModal {...baseProps} open={false} />);
    expect(screen.queryByTestId('ConfirmationModal')).not.toBeInTheDocument();
  });

  // ── Title ────────────────────────────────────────────────────────────────

  it('passes title "Pokal löschen?"', () => {
    render(<CupDeleteConfirmationModal {...baseProps} />);
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Pokal löschen?');
  });

  // ── Message ──────────────────────────────────────────────────────────────

  it('includes cup name in the message when cupName is provided', () => {
    render(<CupDeleteConfirmationModal {...baseProps} cupName="Kreispokal" />);
    expect(screen.getByTestId('modal-message')).toHaveTextContent('Kreispokal');
  });

  it('renders message without name when cupName is undefined', () => {
    render(<CupDeleteConfirmationModal {...baseProps} cupName={undefined} />);
    expect(screen.getByTestId('modal-message')).toBeInTheDocument();
    expect(screen.getByTestId('modal-message')).not.toHaveTextContent('undefined');
  });

  // ── Confirm ──────────────────────────────────────────────────────────────

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(<CupDeleteConfirmationModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId('btn-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('passes confirmText "Löschen"', () => {
    render(<CupDeleteConfirmationModal {...baseProps} />);
    expect(screen.getByTestId('btn-confirm')).toHaveTextContent('Löschen');
  });

  it('passes confirmColor "error"', () => {
    render(<CupDeleteConfirmationModal {...baseProps} />);
    expect(mockConfirmationModal).toHaveBeenCalledWith(
      expect.objectContaining({ confirmColor: 'error' }),
    );
  });

  // ── Close ────────────────────────────────────────────────────────────────

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<CupDeleteConfirmationModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
