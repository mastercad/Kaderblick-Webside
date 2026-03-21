import {
  fetchUserActivity,
  fetchActivityTrend,
  type ActivityOverviewData,
  type ActivityTrendData,
} from '../adminActivity';

const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

const makeOverviewFixture = (overrides: Partial<ActivityOverviewData> = {}): ActivityOverviewData => ({
  users: [
    { id: 1, email: 'max@example.com', fullName: 'Max Muster', roles: ['ROLE_USER'], lastActivityAt: '2026-03-12T10:00:00+00:00', minutesAgo: 5 },
  ],
  stats: { totalCount: 1, activeToday: 1, activeLast7Days: 1, neverActive: 0 },
  pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
  ...overrides,
});

const makeTrendFixture = (overrides: Partial<ActivityTrendData> = {}): ActivityTrendData => ({
  range: 'month',
  data: [{ label: '2026-03-01', count: 3 }, { label: '2026-03-12', count: 7 }],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ── fetchUserActivity ────────────────────────────────────────────────────────

describe('fetchUserActivity', () => {
  it('calls /api/admin/activity without query string when no params given', async () => {
    mockApiJson.mockResolvedValue(makeOverviewFixture());
    await fetchUserActivity();
    expect(mockApiJson).toHaveBeenCalledWith('/api/admin/activity');
  });

  it('appends page and limit to the query string', async () => {
    mockApiJson.mockResolvedValue(makeOverviewFixture());
    await fetchUserActivity({ page: 2, limit: 10 });
    const url: string = mockApiJson.mock.calls[0][0];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  it('appends search param when provided', async () => {
    mockApiJson.mockResolvedValue(makeOverviewFixture());
    await fetchUserActivity({ search: 'max' });
    const url: string = mockApiJson.mock.calls[0][0];
    expect(url).toContain('search=max');
  });

  it('appends sort and dir params when provided', async () => {
    mockApiJson.mockResolvedValue(makeOverviewFixture());
    await fetchUserActivity({ sort: 'email', dir: 'asc' });
    const url: string = mockApiJson.mock.calls[0][0];
    expect(url).toContain('sort=email');
    expect(url).toContain('dir=asc');
  });

  it('returns users, stats and pagination from the response', async () => {
    const fixture = makeOverviewFixture();
    mockApiJson.mockResolvedValue(fixture);
    const result = await fetchUserActivity();
    expect(result.users).toHaveLength(1);
    expect(result.stats.totalCount).toBe(1);
    expect(result.pagination.page).toBe(1);
  });

  it('returns null lastActivityAt and minutesAgo for never-active users', async () => {
    const fixture = makeOverviewFixture({
      users: [{ id: 2, email: 'never@example.com', fullName: 'Never Active', roles: ['ROLE_USER'], lastActivityAt: null, minutesAgo: null }],
    });
    mockApiJson.mockResolvedValue(fixture);
    const result = await fetchUserActivity();
    expect(result.users[0].lastActivityAt).toBeNull();
    expect(result.users[0].minutesAgo).toBeNull();
  });

  it('propagates errors thrown by apiJson', async () => {
    mockApiJson.mockRejectedValue(new Error('Network error'));
    await expect(fetchUserActivity()).rejects.toThrow('Network error');
  });
});

// ── fetchActivityTrend ───────────────────────────────────────────────────────

describe('fetchActivityTrend', () => {
  it('calls /api/admin/activity/trend?range=month by default', async () => {
    mockApiJson.mockResolvedValue(makeTrendFixture());
    await fetchActivityTrend();
    expect(mockApiJson).toHaveBeenCalledWith('/api/admin/activity/trend?range=month');
  });

  it('passes the given range in the query string', async () => {
    mockApiJson.mockResolvedValue(makeTrendFixture({ range: 'week' }));
    await fetchActivityTrend('week');
    expect(mockApiJson).toHaveBeenCalledWith('/api/admin/activity/trend?range=week');
  });

  it('returns the range and data array from the response', async () => {
    const fixture = makeTrendFixture();
    mockApiJson.mockResolvedValue(fixture);
    const result = await fetchActivityTrend('month');
    expect(result.range).toBe('month');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].label).toBe('2026-03-01');
    expect(result.data[0].count).toBe(3);
  });

  it('handles an empty data array (no users active in range)', async () => {
    const fixture = makeTrendFixture({ data: [] });
    mockApiJson.mockResolvedValue(fixture);
    const result = await fetchActivityTrend('today');
    expect(result.data).toEqual([]);
  });

  it('propagates errors thrown by apiJson', async () => {
    mockApiJson.mockRejectedValue(new Error('Forbidden'));
    await expect(fetchActivityTrend('month')).rejects.toThrow('Forbidden');
  });
});
