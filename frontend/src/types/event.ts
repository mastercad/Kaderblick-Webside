export interface User {
  id: string | number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  /** Team/club context for disambiguation, e.g. "U17 · 1. Mannschaft" */
  context?: string;
}

export interface EventData {
  title?: string;
  date?: string;
  time?: string;
  endDate?: string;
  endTime?: string;
  eventType?: string;
  locationId?: string;
  description?: string;
  homeTeam?: string;
  awayTeam?: string;
  gameType?: string;
  leagueId?: string;
  cupId?: string;
  permissionType?: string;
  permissionTeams?: string[];
  permissionClubs?: string[];
  permissionUsers?: string[];
  // Task-bezogene Felder
  task?: {
    id?: number;
    isRecurring?: boolean;
    recurrenceMode?: string;
    recurrenceRule?: string | null;
    rotationUsers?: { id: number; fullName: string }[];
    rotationCount?: number;
    offset?: number;
  };
  taskIsRecurring?: boolean;
  taskRecurrenceMode?: string;
  taskFreq?: string;
  taskInterval?: number;
  taskByDay?: string;
  taskByMonthDay?: number;
  taskRecurrenceRule?: string;
  taskRotationUsers?: string[];
  taskRotationCount?: number;
  taskOffset?: number;
  // Training fields
  trainingTeamId?: string;
  trainingRecurring?: boolean;
  trainingWeekdays?: number[];  // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  trainingEndDate?: string;     // YYYY-MM-DD — end of recurring series
  trainingDuration?: number;    // Duration in minutes (default: 90)
  // Game timing fields (only for Spiel events, not tournaments)
  gameHalfDuration?: number;
  gameHalftimeBreakDuration?: number;
  gameFirstHalfExtraTime?: number | null;
  gameSecondHalfExtraTime?: number | null;
  // Tournament fields
  tournamentId?: string;
  tournamentMatchId?: string;
  pendingTournamentMatches?: any[];
  teamIds?: string[];
  tournament?: any;
  // Tournament settings
  tournamentRoundDuration?: number;
  tournamentBreakTime?: number;
  tournamentGameMode?: 'round_robin' | 'groups_with_finals';
  tournamentType?: 'indoor_hall' | 'normal';
  tournamentNumberOfGroups?: number;
  // Lineup fields
  enableLineups?: boolean;
  homeLineup?: string;
  awayLineup?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}
