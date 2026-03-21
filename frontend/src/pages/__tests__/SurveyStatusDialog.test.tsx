import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SurveyStatusDialog from '../SurveyStatusDialog';

// ────── MUI Mock ──────

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ open, children }: any) => open ? <div data-testid="Dialog">{children}</div> : null,
    DialogTitle: (props: any) => <div data-testid="DialogTitle">{props.children}</div>,
    DialogContent: (props: any) => <div data-testid="DialogContent">{props.children}</div>,
    Box: (props: any) => <div {...props}>{props.children}</div>,
    Typography: (props: any) => <span {...props}>{props.children}</span>,
    CircularProgress: () => <div data-testid="CircularProgress" />,
    Alert: ({ children, severity }: any) => (
      <div data-testid="Alert" role="alert" data-severity={severity}>{children}</div>
    ),
    Divider: () => <hr />,
    Paper: (props: any) => <div data-testid="Paper" {...props}>{props.children}</div>,
    LinearProgress: (props: any) => (
      <div data-testid="LinearProgress" data-value={props.value} />
    ),
    Stack: (props: any) => <div {...props}>{props.children}</div>,
    Chip: (props: any) => <span data-testid="Chip">{props.label}</span>,
    Accordion: (props: any) => <div data-testid="Accordion">{props.children}</div>,
    AccordionSummary: (props: any) => <div data-testid="AccordionSummary">{props.children}</div>,
    AccordionDetails: (props: any) => <div data-testid="AccordionDetails">{props.children}</div>,
  };
});

jest.mock('@mui/icons-material/Poll', () => () => <span>P</span>);
jest.mock('@mui/icons-material/People', () => () => <span>U</span>);
jest.mock('@mui/icons-material/ExpandMore', () => () => <span>▼</span>);
jest.mock('@mui/icons-material/FormatQuote', () => () => <span>"</span>);

// Mock SurveyStatsPanel as a simple stub
jest.mock('../../components/SurveyStatsPanel', () => (props: any) => (
  <div data-testid="SurveyStatsPanel" data-survey-id={props.surveyId}>StatsPanel</div>
));

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

const mockSurvey = {
  id: 42,
  title: 'Trainingsumfrage',
  description: 'Wie war das Training?',
  questions: [
    { id: 1, questionText: 'Bewertung', type: 'scale_1_5' },
    { id: 2, questionText: 'Lieblingsoption', type: 'single_choice' },
    { id: 3, questionText: 'Kommentar', type: 'text' },
  ],
};

const mockResults = {
  answers_total: 8,
  results: [
    {
      id: 1,
      questionText: 'Bewertung',
      type: 'scale_1_5',
      answers: 32,
      options: [
        { id: 1, optionText: '1', count: 0 },
        { id: 2, optionText: '2', count: 1 },
        { id: 3, optionText: '3', count: 2 },
        { id: 4, optionText: '4', count: 3 },
        { id: 5, optionText: '5', count: 2 },
      ],
    },
    {
      id: 2,
      questionText: 'Lieblingsoption',
      type: 'single_choice',
      answers: null,
      options: [
        { id: 10, optionText: 'Option A', count: 5 },
        { id: 11, optionText: 'Option B', count: 3 },
      ],
    },
    {
      id: 3,
      questionText: 'Kommentar',
      type: 'text',
      answers: ['Super!', 'Okay.', 'Weiter so!'],
      options: [],
    },
  ],
};

const defaultProps = {
  surveyId: 42 as number | null,
  open: true,
  onClose: jest.fn(),
};

// ────── Tests ──────

describe('SurveyStatusDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Basic Rendering ──

  it('does not render when open is false', () => {
    render(<SurveyStatusDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument();
  });

  it('renders dialog title', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} />);
    });
    expect(screen.getByTestId('DialogTitle')).toHaveTextContent('Umfrage-Status');
  });

  it('renders survey title from loaded data', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Trainingsumfrage')).toBeInTheDocument();
    });
  });

  it('renders survey description', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Wie war das Training?')).toBeInTheDocument();
    });
  });

  it('shows error when survey load fails', async () => {
    mockApiJson.mockRejectedValue(new Error('Not found'));
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} />);
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // ── Stats vs Results branching ──

  it('shows SurveyStatsPanel when canViewStats is true', async () => {
    mockApiJson.mockResolvedValue(mockSurvey);
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={true} />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('SurveyStatsPanel')).toBeInTheDocument();
    });
    expect(screen.getByTestId('SurveyStatsPanel')).toHaveAttribute('data-survey-id', '42');
  });

  it('does NOT fetch /results when canViewStats is true', async () => {
    mockApiJson.mockResolvedValue(mockSurvey);
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={true} />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('SurveyStatsPanel')).toBeInTheDocument();
    });
    const calls = mockApiJson.mock.calls.map((c: any[]) => c[0]);
    expect(calls.some((url: string) => url.includes('/results'))).toBe(false);
  });

  it('does NOT show SurveyStatsPanel when canViewStats is false', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Trainingsumfrage')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('SurveyStatsPanel')).not.toBeInTheDocument();
  });

  it('fetches /results when canViewStats is false', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      const calls = mockApiJson.mock.calls.map((c: any[]) => c[0]);
      expect(calls.some((url: string) => url.includes('/results'))).toBe(true);
    });
  });

  // ── ResultsView rendering ──

  it('shows total responses count in ResultsView', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/8 Teilnahmen/)).toBeInTheDocument();
    });
  });

  it('renders choice question options in ResultsView', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Option A/)).toBeInTheDocument();
      expect(screen.getByText(/Option B/)).toBeInTheDocument();
    });
  });

  it('renders text answers in ResultsView', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Super!')).toBeInTheDocument();
      expect(screen.getByText('Okay.')).toBeInTheDocument();
      expect(screen.getByText('Weiter so!')).toBeInTheDocument();
    });
  });

  it('renders scale question with average in ResultsView', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      // Average of 32/8 = 4.00
      expect(screen.getByText(/4\.00/)).toBeInTheDocument();
    });
  });

  it('renders question type chips in ResultsView', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      const chips = screen.getAllByTestId('Chip');
      const labels = chips.map((c: HTMLElement) => c.textContent);
      expect(labels).toContain('Skala 1–5');
      expect(labels).toContain('Einzelauswahl');
      expect(labels).toContain('Freitext');
    });
  });

  it('shows info alert when no results available', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve({ answers_total: 0, results: [] });
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Noch keine Auswertungsdaten/)).toBeInTheDocument();
    });
  });

  it('renders accordions per question in ResultsView', async () => {
    mockApiJson.mockImplementation((url: string) => {
      if (url.includes('/results')) return Promise.resolve(mockResults);
      return Promise.resolve(mockSurvey);
    });
    await act(async () => {
      render(<SurveyStatusDialog {...defaultProps} canViewStats={false} />);
    });
    await waitFor(() => {
      const accordions = screen.getAllByTestId('Accordion');
      expect(accordions.length).toBe(3);
    });
  });

  it('does not render when surveyId is null', () => {
    mockApiJson.mockResolvedValue(mockSurvey);
    render(<SurveyStatusDialog surveyId={null} open={true} onClose={jest.fn()} />);
    // Dialog opens but no data is fetched, so just the title
    expect(screen.getByTestId('DialogTitle')).toHaveTextContent('Umfrage-Status');
    // No survey title rendered because useEffect skips on surveyId=null
    expect(screen.queryByText('Trainingsumfrage')).not.toBeInTheDocument();
  });
});
