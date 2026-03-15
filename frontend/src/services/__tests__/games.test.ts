import {
  fetchGameSquad,
  type SquadPlayer,
  type GameSquadData,
} from '../games';

const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ── fetchGameSquad ──────────────────────────────────────────────────────────

describe('fetchGameSquad', () => {
  it('calls the correct endpoint with the given gameId', async () => {
    mockApiJson.mockResolvedValue({ squad: [], allPlayers: [], hasParticipationData: false });

    await fetchGameSquad(42);

    expect(mockApiJson).toHaveBeenCalledWith('/api/games/42/squad');
  });

  it('returns the full response object including squad and hasParticipationData', async () => {
    const fixture: GameSquadData = {
      squad: [
        { id: 1, fullName: 'Max Mustermann', shirtNumber: 7, teamId: 10 },
        { id: 2, fullName: 'Erika Muster', shirtNumber: null, teamId: 10 },
      ],
      allPlayers: [
        { id: 1, fullName: 'Max Mustermann', shirtNumber: 7, teamId: 10 },
        { id: 2, fullName: 'Erika Muster', shirtNumber: null, teamId: 10 },
        { id: 3, fullName: 'Karl Kühn', shirtNumber: 11, teamId: 10 },
      ],
      hasParticipationData: true,
    };
    mockApiJson.mockResolvedValue(fixture);

    const result = await fetchGameSquad(5);

    expect(result).toEqual(fixture);
    expect(result.squad).toHaveLength(2);
    expect(result.hasParticipationData).toBe(true);
  });

  it('returns empty squad and hasParticipationData: false when no participations exist', async () => {
    const fixture: GameSquadData = { squad: [], allPlayers: [], hasParticipationData: false };
    mockApiJson.mockResolvedValue(fixture);

    const result = await fetchGameSquad(99);

    expect(result.squad).toEqual([]);
    expect(result.hasParticipationData).toBe(false);
  });

  it('returns empty squad and hasParticipationData: true when participations exist but nobody attending', async () => {
    const fixture: GameSquadData = { squad: [], allPlayers: [], hasParticipationData: true };
    mockApiJson.mockResolvedValue(fixture);

    const result = await fetchGameSquad(7);

    expect(result.squad).toEqual([]);
    expect(result.hasParticipationData).toBe(true);
  });

  it('propagates errors thrown by apiJson', async () => {
    mockApiJson.mockRejectedValue(new Error('Network error'));

    await expect(fetchGameSquad(1)).rejects.toThrow('Network error');
  });

  it('correctly types SquadPlayer fields', async () => {
    const player: SquadPlayer = {
      id: 3,
      fullName: 'Hans Müller',
      shirtNumber: 10,
      teamId: 2,
    };
    mockApiJson.mockResolvedValue({ squad: [player], allPlayers: [player], hasParticipationData: true });

    const result = await fetchGameSquad(3);
    const first = result.squad[0];

    expect(first.id).toBe(3);
    expect(first.fullName).toBe('Hans Müller');
    expect(first.shirtNumber).toBe(10);
    expect(first.teamId).toBe(2);
  });
});
