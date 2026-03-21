import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CancelledBanner } from '../components/CancelledBanner';

describe('CancelledBanner', () => {
  const defaultProps = {
    reactivating: false,
    onReactivate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Abgesagt" heading', () => {
    render(<CancelledBanner {...defaultProps} />);
    expect(screen.getByText('Abgesagt')).toBeInTheDocument();
  });

  it('renders cancelReason when provided', () => {
    render(<CancelledBanner {...defaultProps} cancelReason="Schlechtes Wetter" />);
    expect(screen.getByText('Schlechtes Wetter')).toBeInTheDocument();
  });

  it('does not render cancelReason when omitted', () => {
    render(<CancelledBanner {...defaultProps} />);
    expect(screen.queryByText(/wetter/i)).not.toBeInTheDocument();
  });

  it('renders cancelledBy attribution', () => {
    render(<CancelledBanner {...defaultProps} cancelledBy="Max Mustermann" />);
    expect(screen.getByText(/Max Mustermann/)).toBeInTheDocument();
  });

  it('does not show reactivate button when canCancel is false', () => {
    render(<CancelledBanner {...defaultProps} canCancel={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not show reactivate button when canCancel is undefined', () => {
    render(<CancelledBanner {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows reactivate button when canCancel is true', () => {
    render(<CancelledBanner {...defaultProps} canCancel={true} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onReactivate when reactivate button is clicked', () => {
    const onReactivate = jest.fn();
    render(<CancelledBanner {...defaultProps} canCancel={true} onReactivate={onReactivate} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onReactivate).toHaveBeenCalledTimes(1);
  });

  it('disables reactivate button when reactivating is true', () => {
    render(<CancelledBanner {...defaultProps} canCancel={true} reactivating={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('reactivate button is enabled when reactivating is false', () => {
    render(<CancelledBanner {...defaultProps} canCancel={true} reactivating={false} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
