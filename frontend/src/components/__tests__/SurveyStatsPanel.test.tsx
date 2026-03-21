import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SurveyStatsPanel from '../SurveyStatsPanel';

// ────── MUI Mock ──────

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Box: (props: any) => <div {...props}>{props.children}</div>,
    Typography: (props: any) => <span {...props}>{props.children}</span>,
    CircularProgress: () => <div data-testid="CircularProgress" />,
    Alert: ({ children, severity }: any) => (
      <div data-testid="Alert" role="alert" data-severity={severity}>{children}</div>
    ),
    LinearProgress: (props: any) => (
      <div data-testid="LinearProgress" data-value={props.value} />
    ),
    Divider: () => <hr />,
    Chip: (props: any) => <span data-testid="Chip">{props.label}</span>,
    Paper: (props: any) => <div data-testid="Paper" {...props}>{props.children}</div>,
    Table: (props: any) => <table>{props.children}</table>,
    TableBody: (props: any) => <tbody>{props.children}</tbody>,
    TableCell: (props: any) => <td>{props.children}</td>,
    TableContainer: (props: any) => <div>{props.children}</div>,
    TableHead: (props: any) => <thead>{props.children}</thead>,
    TableRow: (props: any) => <tr>{props.children}</tr>,
    Accordion: (props: any) => <div data-testid="Accordion">{props.children}</div>,
    AccordionSummary: (props: any) => <div data-testid="AccordionSummary">{props.children}</div>,
    AccordionDetails: (props: any) => <div data-testid="AccordionDetails">{props.children}</div>,
    Stack: (props: any) => <div {...props}>{props.children}</div>,
  };
});

jest.mock('@mui/icons-material/ExpandMore', () => () => <span>▼</span>);
jest.mock('@mui/icons-material/CheckCircle', () => () => <span data-testid="CheckCircleIcon">✓</span>);
jest.mock('@mui/icons-material/Cancel', () => () => <span data-testid="CancelIcon">✕</span>);
jest.mock('@mui/icons-material/Group', () => () => <span data-testid="GroupIcon">G</span>);
jest.mock('@mui/icons-material/Poll', () => () => <span data-testid="PollIcon">P</span>);
jest.mock('@mui/icons-material/NotificationsActive', () => () => <span data-testid="NotificationsActiveIcon">N</span>);

const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.log as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

// ────── Fixtures ──────

function createMockStats(overrides: Record<string, any> = {}) {
  return {
    surveyId: 42,
    title: 'Testumfrage',
    description: 'Eine Testbeschreibung',
    dueDate: '2025-12-31T23:59:00+00:00',
    isExpired: false,
    targetGroup: { type: 'platform', label: 'Gesamte Plattform' },
    totalTargeted: 10,
    totalResponded: 6,
    totalNotResponded: 4,
    participationRate: 60,
    participants: [
      { userId: 1, firstName: 'Max', lastName: 'Mustermann', respondedAt: '2025-06-01T10:00:00+00:00' },
      { userId: 2, firstName: 'Anna', lastName: 'Schmidt', respondedAt: '2025-06-02T14:30:00+00:00' },
    ],
    nonParticipants: [
      { userId: 3, firstName: 'Tom', lastName: 'Müller' },
      { userId: 4, firstName: 'Lisa', lastName: 'Weber' },
    ],
    timeline: { '2025-06-01': 3, '2025-06-02': 3 },
    questionStats: [
      {
        id: 1,
        questionText: 'Welche Farbe?',
        type: 'single_choice',
        options: [
          { id: 10, optionText: 'Rot', count: 4, percentage: 66.7 },
          { id: 11, optionText: 'Blau', count: 2, percentage: 33.3 },
        ],
      },
      {
        id: 2,
        questionText: 'Bewertung?',
        type: 'scale_1_5',
        options: [
          { id: 20, optionText: '1', count: 0, percentage: 0 },
          { id: 21, optionText: '2', count: 1, percentage: 16.7 },
          { id: 22, optionText: '3', count: 2, percentage: 33.3 },
          { id: 23, optionText: '4', count: 2, percentage: 33.3 },
          { id: 24, optionText: '5', count: 1, percentage: 16.7 },
        ],
        scaleAverage: 3.5,
      },
      {
        id: 3,
        questionText: 'Kommentar?',
        type: 'text',
        options: [],
        textAnswers: ['Sehr gut!', 'Könnte besser sein.'],
      },
    ],
    remindersSent: ['2025-06-03T09:00:00+00:00'],
    initialNotificationSent: true,
    ...overrides,
  };
}

// ────── Tests ──────

describe('SurveyStatsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner initially', async () => {
    mockApiJson.mockReturnValue(new Promise(() => {})); // never resolves
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    expect(screen.getByTestId('CircularProgress')).toBeInTheDocument();
  });

  it('shows error alert on API failure', async () => {
    mockApiJson.mockRejectedValue(new Error('Server error'));
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('renders participation overview', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/60/)).toBeInTheDocument();
    });
    // Chips: "6 teilgenommen", "10 Zielgruppe", "4 ausstehend"
    expect(screen.getByText(/6 teilgenommen/)).toBeInTheDocument();
    expect(screen.getByText(/10 Zielgruppe/)).toBeInTheDocument();
    expect(screen.getByText(/4 ausstehend/)).toBeInTheDocument();
  });

  it('renders target group information', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Gesamte Plattform/)).toBeInTheDocument();
    });
  });

  it('renders due date section', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      // The due date section header exists
      expect(screen.getByText(/Fälligkeitsdatum/)).toBeInTheDocument();
    });
  });

  it('renders participant table with names and date', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Max/)).toBeInTheDocument();
      expect(screen.getByText(/Mustermann/)).toBeInTheDocument();
      expect(screen.getByText(/Anna/)).toBeInTheDocument();
      expect(screen.getByText(/Schmidt/)).toBeInTheDocument();
    });
  });

  it('renders non-participant table', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Tom/)).toBeInTheDocument();
      expect(screen.getByText(/Müller/)).toBeInTheDocument();
      expect(screen.getByText(/Lisa/)).toBeInTheDocument();
      expect(screen.getByText(/Weber/)).toBeInTheDocument();
    });
  });

  it('renders question stats with accordions', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Welche Farbe\?/)).toBeInTheDocument();
      expect(screen.getByText(/Bewertung\?/)).toBeInTheDocument();
      expect(screen.getByText(/Kommentar\?/)).toBeInTheDocument();
    });
    // Confirm accordion wrappers exist
    expect(screen.getAllByTestId('Accordion').length).toBeGreaterThanOrEqual(3);
  });

  it('renders choice question options with percentages', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Rot/)).toBeInTheDocument();
      expect(screen.getByText(/Blau/)).toBeInTheDocument();
      // Rendered as "{count} ({percentage}%)"
      expect(screen.getByText('4 (66.7%)')).toBeInTheDocument();
    });
  });

  it('renders scale question average', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/3[.,]5/)).toBeInTheDocument();
    });
  });

  it('renders text question answers', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Sehr gut!/)).toBeInTheDocument();
      expect(screen.getByText(/Könnte besser sein\./)).toBeInTheDocument();
    });
  });

  it('renders notification info', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      // initialNotificationSent = true shows Chip "Gesendet"
      expect(screen.getByText('Gesendet')).toBeInTheDocument();
      expect(screen.getByText(/Benachrichtigungen/)).toBeInTheDocument();
    });
  });

  it('renders timeline chips', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      // Timeline has dates as keys
      const chips = screen.getAllByTestId('Chip');
      expect(chips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "abgelaufen" indicator when expired', async () => {
    mockApiJson.mockResolvedValue(createMockStats({ isExpired: true }));
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/abgelaufen/i)).toBeInTheDocument();
    });
  });

  it('handles empty participants gracefully', async () => {
    mockApiJson.mockResolvedValue(createMockStats({
      totalTargeted: 5,
      totalResponded: 0,
      totalNotResponded: 5,
      participationRate: 0,
      participants: [],
      nonParticipants: [
        { userId: 1, firstName: 'Nur', lastName: 'Zuschauer' },
      ],
      questionStats: [],
      timeline: {},
    }));
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/0 teilgenommen/)).toBeInTheDocument();
      expect(screen.getByText(/Nur/)).toBeInTheDocument();
    });
  });

  it('handles team target group with items', async () => {
    mockApiJson.mockResolvedValue(createMockStats({
      targetGroup: {
        type: 'teams',
        label: 'Teams',
        items: [
          { id: 1, name: 'A-Jugend' },
          { id: 2, name: 'B-Jugend' },
        ],
      },
    }));
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/A-Jugend/)).toBeInTheDocument();
      expect(screen.getByText(/B-Jugend/)).toBeInTheDocument();
    });
  });

  it('handles no reminders sent', async () => {
    mockApiJson.mockResolvedValue(createMockStats({
      remindersSent: [],
      initialNotificationSent: false,
    }));
    await act(async () => {
      render(<SurveyStatsPanel surveyId={42} />);
    });
    await waitFor(() => {
      // initialNotificationSent = false shows Chip "Nicht gesendet"
      expect(screen.getByText('Nicht gesendet')).toBeInTheDocument();
      expect(screen.getByText(/Noch keine Erinnerungen/)).toBeInTheDocument();
    });
  });

  it('calls apiJson with correct URL', async () => {
    mockApiJson.mockResolvedValue(createMockStats());
    await act(async () => {
      render(<SurveyStatsPanel surveyId={99} />);
    });
    expect(mockApiJson).toHaveBeenCalledWith('/api/surveys/99/stats');
  });
});
