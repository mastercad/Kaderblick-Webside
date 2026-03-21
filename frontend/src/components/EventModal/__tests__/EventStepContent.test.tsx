import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventStepContent } from '../EventStepContent';
import {
  STEP_BASE,
  STEP_DETAILS,
  STEP_TIMING,
  STEP_MATCHES,
  STEP_PERMISSIONS,
  STEP_DESCRIPTION,
} from '../eventWizardConstants';

// ── Heavy MUI / component mocks ───────────────────────────────────────────
jest.mock('@mui/material/Box', () => (props: any) => <div>{props.children}</div>);
jest.mock('@mui/material/Typography', () => (props: any) => <span>{props.children}</span>);
jest.mock('@mui/material/TextField', () => (props: any) => (
  <textarea data-testid={props.label || 'TextField'} placeholder={props.placeholder} />
));

jest.mock('../EventBaseForm',      () => ({ EventBaseForm:      () => <div data-testid="EventBaseForm" />      }));
jest.mock('../GameEventFields',    () => ({ GameEventFields:    () => <div data-testid="GameEventFields" />    }));
jest.mock('../GameTimingFields',   () => ({ GameTimingFields:   () => <div data-testid="GameTimingFields" />   }));
jest.mock('../TaskEventFields',    () => ({ TaskEventFields:    () => <div data-testid="TaskEventFields" />    }));
jest.mock('../TrainingEventFields',() => ({ TrainingEventFields:() => <div data-testid="TrainingEventFields" />}));
jest.mock('../PermissionFields',   () => ({ PermissionFields:   () => <div data-testid="PermissionFields" />   }));
jest.mock('../TournamentFields',   () => ({
  TournamentConfig:         () => <div data-testid="TournamentConfig" />,
  TournamentMatchesManagement: () => <div data-testid="TournamentMatchesManagement" />,
  TournamentSelection:      () => <div data-testid="TournamentSelection" />,
}));
jest.mock('../WizardSteps', () => ({
  WizardStep2Tournament: () => <div data-testid="WizardStep2Tournament" />,
}));
jest.mock('../LocationField', () => ({
  LocationField: () => <div data-testid="LocationField" />,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────
const noop = jest.fn();
const base = {
  event: {} as any,
  eventTypes: [],
  locations:  [],
  teams:      [],
  matchTeams: [],
  gameTypes:  [],
  tournaments:[],
  leagues:    [],
  cups:       [],
  users:      [],
  tournamentMatches: [],
  isMobile: false,
  isMatchEvent: false,
  isTournament: false,
  isTournamentEventType: false,
  isTask: false,
  isTraining: false,
  isGenericEvent: false,
  editingMatchId: null,
  editingMatchDraft: null,
  setEditingMatchDraft: noop,
  handleChange: noop,
  onTournamentMatchChange: noop,
  onImportOpen: noop,
  onManualOpen: noop,
  onGeneratorOpen: noop,
  onGeneratePlan: noop,
  onClearMatches: noop,
  onAddMatch: noop,
  onEditMatch: noop,
  onSaveMatch: noop,
  onCancelEdit: noop,
  onDeleteMatch: noop,
};

describe('EventStepContent', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── STEP_BASE ─────────────────────────────────────────────────────────────

  it('renders EventBaseForm on STEP_BASE', () => {
    render(<EventStepContent {...base} currentStepKey={STEP_BASE} />);
    expect(screen.getByTestId('EventBaseForm')).toBeInTheDocument();
  });

  // ── STEP_DETAILS – training ───────────────────────────────────────────────

  it('renders LocationField + TrainingEventFields on STEP_DETAILS for training', () => {
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_DETAILS}
        isTraining={true}
      />
    );
    expect(screen.getByTestId('LocationField')).toBeInTheDocument();
    expect(screen.getByTestId('TrainingEventFields')).toBeInTheDocument();
  });

  // ── STEP_DETAILS – match ──────────────────────────────────────────────────

  it('renders GameEventFields on STEP_DETAILS for match events', () => {
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_DETAILS}
        isMatchEvent={true}
      />
    );
    expect(screen.getByTestId('GameEventFields')).toBeInTheDocument();
  });

  it('renders TournamentSelection + TournamentConfig when isTournament', () => {
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_DETAILS}
        isMatchEvent={true}
        isTournament={true}
      />
    );
    expect(screen.getByTestId('TournamentSelection')).toBeInTheDocument();
    expect(screen.getByTestId('TournamentConfig')).toBeInTheDocument();
    expect(screen.getByTestId('TournamentMatchesManagement')).toBeInTheDocument();
  });

  // ── STEP_DETAILS – task ───────────────────────────────────────────────────

  it('renders TaskEventFields on STEP_DETAILS for task events', () => {
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_DETAILS}
        isTask={true}
      />
    );
    expect(screen.getByTestId('TaskEventFields')).toBeInTheDocument();
  });

  // ── STEP_DETAILS – no type selected ──────────────────────────────────────

  it('renders hint text when no event type is selected on STEP_DETAILS', () => {
    render(<EventStepContent {...base} currentStepKey={STEP_DETAILS} />);
    expect(screen.getByText(/Bitte zuerst den Event-Typ/i)).toBeInTheDocument();
  });

  // ── STEP_TIMING ─────────────────────────────────────────────────────────

  it('renders GameTimingFields on STEP_TIMING for match events', () => {
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_TIMING}
        isMatchEvent={true}
        event={{ homeTeam: '1' } as any}
        teamDefaultsMap={{ '1': { defaultHalfDuration: 40, defaultHalftimeBreakDuration: 10 } }}
      />
    );
    expect(screen.getByTestId('GameTimingFields')).toBeInTheDocument();
  });

  // ── STEP_MATCHES ──────────────────────────────────────────────────────────

  it('renders WizardStep2Tournament on STEP_MATCHES', () => {
    render(<EventStepContent {...base} currentStepKey={STEP_MATCHES} />);
    expect(screen.getByTestId('WizardStep2Tournament')).toBeInTheDocument();
  });

  // ── STEP_PERMISSIONS ──────────────────────────────────────────────────────

  it('renders LocationField + PermissionFields on STEP_PERMISSIONS', () => {
    render(<EventStepContent {...base} currentStepKey={STEP_PERMISSIONS} />);
    expect(screen.getByTestId('LocationField')).toBeInTheDocument();
    expect(screen.getByTestId('PermissionFields')).toBeInTheDocument();
  });

  // ── STEP_DESCRIPTION ─────────────────────────────────────────────────────

  it('renders description textarea on STEP_DESCRIPTION', () => {
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_DESCRIPTION}
        event={{ description: 'Testbeschreibung' } as any}
      />,
    );
    expect(screen.getByTestId('Beschreibung')).toBeInTheDocument();
  });

  it('renders mobile rows when isMobile is true', () => {
    // Just verify it renders without throwing
    render(
      <EventStepContent
        {...base}
        currentStepKey={STEP_DESCRIPTION}
        isMobile={true}
      />,
    );
    expect(screen.getByTestId('Beschreibung')).toBeInTheDocument();
  });

  // ── Unknown step ──────────────────────────────────────────────────────────

  it('renders null for unknown step key', () => {
    const { container } = render(
      <EventStepContent {...base} currentStepKey={'unknown' as any} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
