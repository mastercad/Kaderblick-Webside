import {
  generateTournamentMatches,
  calculateTournamentDuration,
  calculateTournamentEndTime,
  type GenerateTournamentMatchesOptions,
} from '../tournamentGenerator';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    value: String(i + 1),
    label: `Team ${i + 1}`,
  }));
}

const BASE_START = '2025-01-01T10:00:00.000Z';

function baseOptions(
  overrides: Partial<GenerateTournamentMatchesOptions> = {}
): GenerateTournamentMatchesOptions {
  return {
    teams: makeTeams(4),
    gameMode: 'round_robin',
    tournamentType: 'indoor_hall',
    roundDuration: 10,
    breakTime: 2,
    startTime: BASE_START,
    ...overrides,
  };
}

// ─── calculateTournamentDuration ────────────────────────────────────────────

describe('calculateTournamentDuration', () => {
  it('returns 0 for 0 matches', () => {
    expect(calculateTournamentDuration(0, 10, 2)).toBe(0);
  });

  it('returns roundDuration for 1 match', () => {
    expect(calculateTournamentDuration(1, 10, 2)).toBe(10);
  });

  it('calculates correctly for multiple matches', () => {
    // 3 matches: 3*10 + 2*2 = 34
    expect(calculateTournamentDuration(3, 10, 2)).toBe(34);
  });

  it('calculates with zero break time', () => {
    // 5 matches: 5*8 + 0 = 40
    expect(calculateTournamentDuration(5, 8, 0)).toBe(40);
  });

  it('calculates with large values', () => {
    // 6 matches: 6*15 + 5*5 = 115
    expect(calculateTournamentDuration(6, 15, 5)).toBe(115);
  });
});

// ─── calculateTournamentEndTime ──────────────────────────────────────────────

describe('calculateTournamentEndTime', () => {
  it('returns start time for 0 matches', () => {
    const result = calculateTournamentEndTime(BASE_START, 0, 10, 2);
    expect(new Date(result).getTime()).toBe(new Date(BASE_START).getTime());
  });

  it('returns correct end time for 1 match', () => {
    // 10 minutes = 600000ms
    const result = calculateTournamentEndTime(BASE_START, 1, 10, 2);
    const expected = new Date(new Date(BASE_START).getTime() + 10 * 60000);
    expect(new Date(result).getTime()).toBe(expected.getTime());
  });

  it('returns correct end time for 3 matches (duration 34 min)', () => {
    const result = calculateTournamentEndTime(BASE_START, 3, 10, 2);
    const expected = new Date(new Date(BASE_START).getTime() + 34 * 60000);
    expect(new Date(result).getTime()).toBe(expected.getTime());
  });

  it('returns an ISO string', () => {
    const result = calculateTournamentEndTime(BASE_START, 2, 10, 3);
    expect(typeof result).toBe('string');
    expect(() => new Date(result)).not.toThrow();
  });
});

// ─── generateTournamentMatches — edge cases ──────────────────────────────────

describe('generateTournamentMatches — edge cases', () => {
  it('returns [] for undefined teams', () => {
    const result = generateTournamentMatches({
      ...baseOptions(),
      teams: undefined as any,
    });
    expect(result).toEqual([]);
  });

  it('returns [] for 0 teams', () => {
    expect(generateTournamentMatches(baseOptions({ teams: [] }))).toEqual([]);
  });

  it('returns [] for 1 team', () => {
    expect(generateTournamentMatches(baseOptions({ teams: makeTeams(1) }))).toEqual([]);
  });

  it('returns [] for unknown gameMode', () => {
    const result = generateTournamentMatches(baseOptions({ gameMode: 'unknown' as any }));
    expect(result).toEqual([]);
  });
});

// ─── Round-robin — indoor_hall ────────────────────────────────────────────────

describe('generateTournamentMatches — round_robin indoor_hall', () => {
  const opts = (n: number, overrides: Partial<GenerateTournamentMatchesOptions> = {}) =>
    baseOptions({ teams: makeTeams(n), tournamentType: 'indoor_hall', ...overrides });

  it('generates correct number of matches for 2 teams (1 match)', () => {
    const matches = generateTournamentMatches(opts(2));
    expect(matches).toHaveLength(1);
  });

  it('generates correct number of matches for 3 teams (3 matches)', () => {
    // 3 teams: C(3,2)=3 matches
    const matches = generateTournamentMatches(opts(3));
    expect(matches).toHaveLength(3);
  });

  it('generates correct number of matches for 4 teams (6 matches)', () => {
    // 4 teams: C(4,2)=6 matches
    const matches = generateTournamentMatches(opts(4));
    expect(matches).toHaveLength(6);
  });

  it('generates correct number of matches for 5 teams (10 matches)', () => {
    // 5 teams: C(5,2)=10 matches
    const matches = generateTournamentMatches(opts(5));
    expect(matches).toHaveLength(10);
  });

  it('generates correct number of matches for 6 teams (15 matches)', () => {
    const matches = generateTournamentMatches(opts(6));
    expect(matches).toHaveLength(15);
  });

  it('all matches have required fields', () => {
    const matches = generateTournamentMatches(opts(4));
    for (const m of matches) {
      expect(m).toHaveProperty('round');
      expect(m).toHaveProperty('slot');
      expect(m).toHaveProperty('homeTeamId');
      expect(m).toHaveProperty('awayTeamId');
      expect(m).toHaveProperty('homeTeamName');
      expect(m).toHaveProperty('awayTeamName');
      expect(m).toHaveProperty('scheduledAt');
      expect(m).toHaveProperty('stage');
    }
  });

  it('no team plays itself', () => {
    const matches = generateTournamentMatches(opts(6));
    for (const m of matches) {
      expect(m.homeTeamId).not.toBe(m.awayTeamId);
    }
  });

  it('no dummy teams appear in matches', () => {
    // 5 teams → odd → dummy inserted
    const matches = generateTournamentMatches(opts(5));
    for (const m of matches) {
      expect(m.homeTeamId).not.toBe('dummy');
      expect(m.awayTeamId).not.toBe('dummy');
    }
  });

  it('slots are sequential starting at 1', () => {
    const matches = generateTournamentMatches(opts(4));
    const slots = matches.map(m => m.slot).sort((a, b) => a - b);
    expect(slots[0]).toBe(1);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i]).toBe(slots[i - 1] + 1);
    }
  });

  it('scheduled times are sequential (each += roundDuration + breakTime)', () => {
    const opts4 = opts(4, { roundDuration: 10, breakTime: 2 });
    const matches = generateTournamentMatches(opts4);
    const sorted = [...matches].sort((a, b) => a.slot - b.slot);
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        new Date(sorted[i].scheduledAt).getTime() -
        new Date(sorted[i - 1].scheduledAt).getTime();
      expect(diff).toBe((10 + 2) * 60000);
    }
  });

  it('each pair meets exactly once', () => {
    const matches = generateTournamentMatches(opts(4));
    const pairs = new Set<string>();
    for (const m of matches) {
      const key = [m.homeTeamId, m.awayTeamId].sort().join('-');
      expect(pairs.has(key)).toBe(false);
      pairs.add(key);
    }
  });

  it('works with 2 teams', () => {
    const matches = generateTournamentMatches(opts(2));
    expect(matches[0].homeTeamId).not.toBe(matches[0].awayTeamId);
  });
});

// ─── Round-robin — normal ─────────────────────────────────────────────────────

describe('generateTournamentMatches — round_robin normal', () => {
  const opts = (n: number, overrides: Partial<GenerateTournamentMatchesOptions> = {}) =>
    baseOptions({ teams: makeTeams(n), tournamentType: 'normal', ...overrides });

  it('generates correct number of matches for 4 teams', () => {
    expect(generateTournamentMatches(opts(4))).toHaveLength(6);
  });

  it('generates correct number of matches for 3 teams', () => {
    expect(generateTournamentMatches(opts(3))).toHaveLength(3);
  });

  it('generates correct number of matches for 5 teams (odd, with dummy skipped)', () => {
    expect(generateTournamentMatches(opts(5))).toHaveLength(10);
  });

  it('no dummy teams in results', () => {
    const matches = generateTournamentMatches(opts(5));
    for (const m of matches) {
      expect(m.homeTeamId).not.toBe('dummy');
      expect(m.awayTeamId).not.toBe('dummy');
    }
  });

  it('all matches have required fields', () => {
    const matches = generateTournamentMatches(opts(4));
    for (const m of matches) {
      expect(m).toHaveProperty('round');
      expect(m).toHaveProperty('slot');
      expect(m).toHaveProperty('homeTeamId');
      expect(m).toHaveProperty('awayTeamId');
    }
  });

  it('no team plays itself', () => {
    const matches = generateTournamentMatches(opts(4));
    for (const m of matches) {
      expect(m.homeTeamId).not.toBe(m.awayTeamId);
    }
  });

  it('each pair meets exactly once (6 teams)', () => {
    const matches = generateTournamentMatches(opts(6));
    const pairs = new Set<string>();
    for (const m of matches) {
      const key = [m.homeTeamId, m.awayTeamId].sort().join('-');
      expect(pairs.has(key)).toBe(false);
      pairs.add(key);
    }
  });
});

// ─── Groups with finals ───────────────────────────────────────────────────────

describe('generateTournamentMatches — groups_with_finals', () => {
  const opts = (
    n: number,
    groups: number,
    type: 'indoor_hall' | 'normal' = 'indoor_hall',
    overrides: Partial<GenerateTournamentMatchesOptions> = {}
  ) =>
    baseOptions({
      teams: makeTeams(n),
      gameMode: 'groups_with_finals',
      tournamentType: type,
      numberOfGroups: groups,
      ...overrides,
    });

  it('falls back to round-robin if fewer than 4 teams', () => {
    // 3 teams < 4 → round-robin fallback → 3 matches
    const matches = generateTournamentMatches(opts(3, 2));
    expect(matches).toHaveLength(3);
  });

  it('produces group matches + KO matches for 2 groups (indoor_hall)', () => {
    // 4 teams, 2 groups → each group 1 match, then 2 HF + 1 P3 + 1 Finale = 6 total
    const matches = generateTournamentMatches(opts(4, 2, 'indoor_hall'));
    expect(matches.length).toBeGreaterThan(0);
  });

  it('produces group matches for 2 groups (normal)', () => {
    const matches = generateTournamentMatches(opts(4, 2, 'normal'));
    expect(matches.length).toBeGreaterThan(0);
  });

  it('includes Halbfinale stage for 2-group setup', () => {
    const matches = generateTournamentMatches(opts(4, 2, 'normal'));
    const stages = matches.map(m => m.stage);
    expect(stages.some(s => s === 'Halbfinale')).toBe(true);
  });

  it('includes Finale stage', () => {
    const matches = generateTournamentMatches(opts(4, 2, 'normal'));
    const stages = matches.map(m => m.stage);
    expect(stages.some(s => s === 'Finale')).toBe(true);
  });

  it('includes Spiel um Platz 3 stage', () => {
    const matches = generateTournamentMatches(opts(4, 2, 'normal'));
    const stages = matches.map(m => m.stage);
    expect(stages.some(s => s === 'Spiel um Platz 3')).toBe(true);
  });

  it('all matches have required fields', () => {
    const matches = generateTournamentMatches(opts(6, 2, 'normal'));
    for (const m of matches) {
      expect(m).toHaveProperty('round');
      expect(m).toHaveProperty('slot');
      expect(m).toHaveProperty('scheduledAt');
      expect(m).toHaveProperty('stage');
    }
  });

  it('works with 8 teams, 2 groups (normal)', () => {
    const matches = generateTournamentMatches(opts(8, 2, 'normal'));
    expect(matches.length).toBeGreaterThan(4);
  });

  it('works with 8 teams, 2 groups (indoor_hall)', () => {
    const matches = generateTournamentMatches(opts(8, 2, 'indoor_hall'));
    expect(matches.length).toBeGreaterThan(4);
  });

  it('uses default 2 groups when numberOfGroups not provided', () => {
    const opts2 = baseOptions({
      teams: makeTeams(4),
      gameMode: 'groups_with_finals',
      tournamentType: 'normal',
      // numberOfGroups omitted
    });
    const matches = generateTournamentMatches(opts2);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('scheduled times are monotonically increasing', () => {
    const matches = generateTournamentMatches(opts(6, 2, 'normal'));
    const times = matches.map(m => new Date(m.scheduledAt).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
  });

  it('KO matches have homeTeamId tbd', () => {
    const matches = generateTournamentMatches(opts(4, 2, 'normal'));
    const ko = matches.filter(m => m.stage === 'Halbfinale' || m.stage === 'Finale');
    for (const m of ko) {
      expect(m.homeTeamId).toBe('tbd');
      expect(m.awayTeamId).toBe('tbd');
    }
  });
});
