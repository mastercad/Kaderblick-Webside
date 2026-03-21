import { fetchCups } from '../cups';

const mockApiJson = jest.fn();
jest.mock('../../utils/api', () => ({
  apiJson: (...args: any[]) => mockApiJson(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchCups', () => {
  it('calls the correct endpoint', async () => {
    mockApiJson.mockResolvedValue({ cups: [] });

    await fetchCups();

    expect(mockApiJson).toHaveBeenCalledWith('/api/cups');
  });

  it('returns the cups array from the response', async () => {
    const fixture = [
      { id: 1, name: 'Kreispokal' },
      { id: 2, name: 'Stadtpokal' },
    ];
    mockApiJson.mockResolvedValue({ cups: fixture });

    const result = await fetchCups();

    expect(result).toEqual(fixture);
  });

  it('returns an empty array when response has no cups key', async () => {
    mockApiJson.mockResolvedValue({});

    const result = await fetchCups();

    expect(result).toEqual([]);
  });

  it('returns an empty array when cups is null', async () => {
    mockApiJson.mockResolvedValue({ cups: null });

    const result = await fetchCups();

    expect(result).toEqual([]);
  });

  it('returns only id and name fields per cup', async () => {
    mockApiJson.mockResolvedValue({
      cups: [{ id: 5, name: 'DFB-Pokal', permissions: { canEdit: true } }],
    });

    const result = await fetchCups();

    expect(result[0].id).toBe(5);
    expect(result[0].name).toBe('DFB-Pokal');
  });
});
