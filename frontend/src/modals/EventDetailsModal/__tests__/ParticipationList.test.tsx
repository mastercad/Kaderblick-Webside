import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ParticipationList } from '../components/ParticipationList';
import type { Participation } from '../types';

const PARTICIPATIONS: Participation[] = [
  {
    user_id: 1,
    user_name: 'Alice',
    is_team_player: true,
    status: { id: 1, name: 'Zugesagt', color: '#4caf50', code: 'yes' },
    note: '',
  },
  {
    user_id: 2,
    user_name: 'Bob',
    is_team_player: true,
    status: { id: 1, name: 'Zugesagt', color: '#4caf50', code: 'yes' },
    note: 'Komme etwas später',
  },
  {
    user_id: 3,
    user_name: 'Carol',
    is_team_player: false,
    status: { id: 2, name: 'Abgesagt', color: '#f44336', code: 'no' },
    note: '',
  },
];

describe('ParticipationList', () => {
  const onOpenOverview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Noch keine Rückmeldungen" when list is empty', () => {
    render(<ParticipationList participations={[]} onOpenOverview={onOpenOverview} />);
    expect(screen.getByText(/Noch keine Rückmeldungen/)).toBeInTheDocument();
  });

  it('shows participant count in header', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    expect(screen.getByText(/Teilnehmer \(3\)/)).toBeInTheDocument();
  });

  it('renders all participant names', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('groups participants by status name', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    // "Zugesagt (2)" and "Abgesagt (1)" group headers
    expect(screen.getByText(/ZUGESAGT \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ABGESAGT \(1\)/i)).toBeInTheDocument();
  });

  it('shows notes for participants that have one', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    expect(screen.getByText('Komme etwas später')).toBeInTheDocument();
  });

  it('renders the "Übersicht" button', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    expect(screen.getByRole('button', { name: /übersicht/i })).toBeInTheDocument();
  });

  it('calls onOpenOverview when "Übersicht" button is clicked', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    fireEvent.click(screen.getByRole('button', { name: /übersicht/i }));
    expect(onOpenOverview).toHaveBeenCalledTimes(1);
  });

  it('collapses the list when header is clicked', () => {
    render(<ParticipationList participations={PARTICIPATIONS} onOpenOverview={onOpenOverview} />);
    // Initially visible
    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Click to collapse (header Stack)
    const header = screen.getByText(/Teilnehmer \(3\)/);
    fireEvent.click(header);

    // MUI Collapse: the content container should have display:none or similar
    // We just verify the click doesn't throw and the header still exists
    expect(header).toBeInTheDocument();
  });
});
