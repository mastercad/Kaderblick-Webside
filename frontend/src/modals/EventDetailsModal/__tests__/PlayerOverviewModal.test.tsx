import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerOverviewModal } from '../components/PlayerOverviewModal';

// PlayerOverviewModal uses useMediaQuery
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

const mockApiJson = jest.fn();
jest.mock('../../../utils/api', () => ({
  apiJson: (...args: unknown[]) => mockApiJson(...args),
}));

const OVERVIEW_ONE_TEAM = {
  teams: [
    {
      id: 1,
      name: 'A-Jugend',
      members: [
        {
          user_id: 10,
          user_name: 'Alice',
          participation: {
            status_id: 1,
            status_name: 'Zugesagt',
            status_code: 'yes',
            status_color: '#4caf50',
            note: null,
          },
        },
        {
          user_id: 11,
          user_name: 'Bob',
          participation: null,
        },
      ],
    },
  ],
  my_team_id: 1,
};

const OVERVIEW_TWO_TEAMS = {
  teams: [
    {
      id: 1,
      name: 'A-Jugend',
      members: [
        { user_id: 10, user_name: 'Alice', participation: null },
      ],
    },
    {
      id: 2,
      name: 'B-Jugend',
      members: [
        { user_id: 20, user_name: 'Carol', participation: null },
      ],
    },
  ],
  my_team_id: 2,
};

describe('PlayerOverviewModal', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    eventId: 5,
    eventTitle: 'Training',
  };

  beforeEach(() => {
    mockApiJson.mockReset();
    jest.clearAllMocks();
  });

  it('does not render when closed', () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    const { queryByText } = render(<PlayerOverviewModal {...baseProps} open={false} />);
    expect(queryByText('Teilnehmerübersicht')).not.toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    mockApiJson.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<PlayerOverviewModal {...baseProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dialog title after loading', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() =>
      expect(screen.getByText('Teilnehmerübersicht')).toBeInTheDocument(),
    );
  });

  it('shows eventTitle in subtitle', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(screen.getByText('Training')).toBeInTheDocument());
  });

  it('fetches overview from correct endpoint', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(mockApiJson).toHaveBeenCalled());
    expect(mockApiJson).toHaveBeenCalledWith('/api/participation/event/5/overview');
  });

  it('shows responded member names', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
  });

  it('shows pending member names', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument());
  });

  it('shows summary chips with counts', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(screen.getByText('1 geantwortet')).toBeInTheDocument());
    expect(screen.getByText('1 ausstehend')).toBeInTheDocument();
  });

  it('hides team selector when only one team', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_ONE_TEAM);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.queryByLabelText('Team')).not.toBeInTheDocument();
  });

  it('shows team selector when multiple teams', async () => {
    mockApiJson.mockResolvedValue(OVERVIEW_TWO_TEAMS);
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() => expect(screen.getByLabelText('Team')).toBeInTheDocument());
  });

  it('shows "Keine Teamdaten verfügbar" on empty response', async () => {
    mockApiJson.mockResolvedValue({ teams: [], my_team_id: null });
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() =>
      expect(screen.getByText('Keine Teamdaten verfügbar.')).toBeInTheDocument(),
    );
  });

  it('shows "Keine Teamdaten verfügbar" on API error', async () => {
    mockApiJson.mockRejectedValue(new Error('500'));
    render(<PlayerOverviewModal {...baseProps} />);
    await waitFor(() =>
      expect(screen.getByText('Keine Teamdaten verfügbar.')).toBeInTheDocument(),
    );
  });
});
