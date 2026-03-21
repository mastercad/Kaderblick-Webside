import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamRideDetailsModal from '../TeamRideDetailsModal';

// Mock BaseModal
jest.mock('../BaseModal', () => ({
  __esModule: true,
  default: ({ open, title, children, actions }: any) => open ? (
    <div data-testid="Dialog">
      <div data-testid="DialogTitle">{title}</div>
      <div data-testid="DialogContent">{children}</div>
      <div data-testid="DialogActions">{actions}</div>
    </div>
  ) : null,
}));

// Mock AddTeamRideModal
jest.mock('../AddTeamRideModal', () => () => null);

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 10, name: 'Test User' } }),
}));

// Mock apiJson
jest.mock('../../utils/api', () => ({
  apiJson: jest.fn(),
}));
import { apiJson } from '../../utils/api';

const mockRides = [
  {
    id: 1,
    driverId: 10, // same as current user
    driver: 'Test User',
    seats: 4,
    availableSeats: 2,
    passengers: [
      { id: 20, name: 'Passenger A' },
      { id: 30, name: 'Passenger B' },
    ],
    note: 'Ab Hauptbahnhof',
  },
  {
    id: 2,
    driverId: 40,
    driver: 'Other Driver',
    seats: 3,
    availableSeats: 3,
    passengers: [],
  },
];

const mockRidesWithUserAsPassenger = [
  {
    id: 3,
    driverId: 40,
    driver: 'Other Driver',
    seats: 3,
    availableSeats: 1,
    passengers: [
      { id: 10, name: 'Test User' },
      { id: 50, name: 'Other Passenger' },
    ],
  },
];

describe('TeamRideDetailsModal', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (apiJson as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/teamrides/event/')) {
        return Promise.resolve({ rides: mockRides });
      }
      return Promise.resolve({});
    });
  });

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    eventId: 1,
    cancelled: false,
  };

  it('renders modal with rides', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} />);
    });
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
      expect(screen.getByText(/Other Driver/)).toBeInTheDocument();
    });
  });

  it('shows driver info and passengers', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Passenger A')).toBeInTheDocument();
      expect(screen.getByText('Passenger B')).toBeInTheDocument();
    });
  });

  it('shows "Mitfahrgelegenheit anbieten" button when not cancelled', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} />);
    });
    expect(screen.getByText('Mitfahrgelegenheit anbieten')).toBeInTheDocument();
  });

  it('hides "Mitfahrgelegenheit anbieten" button when cancelled', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} cancelled={true} />);
    });
    expect(screen.queryByText('Mitfahrgelegenheit anbieten')).not.toBeInTheDocument();
  });

  it('shows "Platz buchen" button for non-driver/non-passenger rides when not cancelled', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} />);
    });
    await waitFor(() => {
      // Ride 2 has a different driver and no passengers — should show book button
      expect(screen.getByText('Platz buchen')).toBeInTheDocument();
    });
  });

  it('hides "Platz buchen" button when cancelled', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} cancelled={true} />);
    });
    await waitFor(() => {
      expect(screen.queryByText('Platz buchen')).not.toBeInTheDocument();
    });
  });

  it('hides driver delete icon when cancelled', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} cancelled={true} />);
    });
    await waitFor(() => {
      // The delete icon tooltips should not be rendered
      expect(screen.queryByLabelText('Mitfahrgelegenheit zurückziehen')).not.toBeInTheDocument();
    });
  });

  it('shows "Buchung stornieren" button for passenger when not cancelled', async () => {
    (apiJson as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/teamrides/event/')) {
        return Promise.resolve({ rides: mockRidesWithUserAsPassenger });
      }
      return Promise.resolve({});
    });

    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Buchung stornieren')).toBeInTheDocument();
    });
  });

  it('hides "Buchung stornieren" button when cancelled', async () => {
    (apiJson as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/teamrides/event/')) {
        return Promise.resolve({ rides: mockRidesWithUserAsPassenger });
      }
      return Promise.resolve({});
    });

    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} cancelled={true} />);
    });
    await waitFor(() => {
      expect(screen.queryByText('Buchung stornieren')).not.toBeInTheDocument();
    });
  });

  it('still shows ride details in read-only when cancelled', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} cancelled={true} />);
    });
    await waitFor(() => {
      // Ride info should still be visible
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
      expect(screen.getByText(/Other Driver/)).toBeInTheDocument();
      expect(screen.getByText('Passenger A')).toBeInTheDocument();
      expect(screen.getByText('Passenger B')).toBeInTheDocument();
      expect(screen.getByText(/Ab Hauptbahnhof/)).toBeInTheDocument();
    });
  });

  it('shows empty message when no rides', async () => {
    (apiJson as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/teamrides/event/')) {
        return Promise.resolve({ rides: [] });
      }
      return Promise.resolve({});
    });

    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Keine Mitfahrgelegenheiten gefunden/)).toBeInTheDocument();
    });
  });

  it('renders nothing when modal is closed', async () => {
    await act(async () => {
      render(<TeamRideDetailsModal {...defaultProps} open={false} />);
    });
    expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument();
  });
});
