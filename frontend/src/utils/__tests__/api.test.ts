/**
 * Tests for utils/api.ts
 * Tests apiRequest, apiJson, apiBlob, ApiError, isAuthenticationError, getApiErrorMessage
 */

// Mock config
jest.mock('../../../config', () => ({
  BACKEND_URL: 'http://localhost:8081',
}));

import { apiRequest, apiJson, apiBlob, ApiError, isAuthenticationError, getApiErrorMessage } from '../api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeFakeResponse(body: any, status = 200) {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => {
      try {
        return Promise.resolve(JSON.parse(json));
      } catch {
        return Promise.reject(new SyntaxError('Invalid JSON'));
      }
    },
    blob: () => Promise.resolve(new Blob([json])),
  };
}

function mockFetchOk(body: any, status = 200) {
  const response = makeFakeResponse(body, status);
  global.fetch = jest.fn().mockResolvedValue(response);
  return response;
}

function mockFetchStatus(status: number, body: any = {}) {
  const response = makeFakeResponse(body, status);
  global.fetch = jest.fn().mockResolvedValue(response);
  return response;
}

// ─── ApiError ────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('is an instance of Error', () => {
    const err = new ApiError('Test', 404);
    expect(err).toBeInstanceOf(Error);
  });

  it('has name ApiError', () => {
    const err = new ApiError('Test', 400);
    expect(err.name).toBe('ApiError');
  });

  it('stores status and data', () => {
    const err = new ApiError('Msg', 403, { detail: 'no' });
    expect(err.status).toBe(403);
    expect(err.data).toEqual({ detail: 'no' });
  });

  it('can be constructed with only message', () => {
    const err = new ApiError('Only message');
    expect(err.message).toBe('Only message');
    expect(err.status).toBeUndefined();
    expect(err.data).toBeUndefined();
  });
});

// ─── isAuthenticationError ───────────────────────────────────────────────────

describe('isAuthenticationError', () => {
  it('returns true for ApiError with status 401', () => {
    expect(isAuthenticationError(new ApiError('Unauthorized', 401))).toBe(true);
  });

  it('returns false for ApiError with status 403', () => {
    expect(isAuthenticationError(new ApiError('Forbidden', 403))).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(isAuthenticationError(new Error('test'))).toBe(false);
  });

  it('returns false for non-error value', () => {
    expect(isAuthenticationError('string')).toBe(false);
    expect(isAuthenticationError(null)).toBe(false);
    expect(isAuthenticationError(undefined)).toBe(false);
    expect(isAuthenticationError(401)).toBe(false);
  });
});

// ─── getApiErrorMessage ──────────────────────────────────────────────────────

describe('getApiErrorMessage', () => {
  it('returns German 403 message', () => {
    expect(getApiErrorMessage(new ApiError('X', 403))).toBe('Sie haben keine Berechtigung für diese Aktion.');
  });

  it('returns German 404 message', () => {
    expect(getApiErrorMessage(new ApiError('X', 404))).toBe('Der Eintrag wurde nicht gefunden.');
  });

  it('returns German server error message for 500', () => {
    expect(getApiErrorMessage(new ApiError('X', 500))).toBe('Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
  });

  it('returns German server error message for 503', () => {
    expect(getApiErrorMessage(new ApiError('X', 503))).toBe('Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
  });

  it('returns error.message for ApiError with non-special status', () => {
    expect(getApiErrorMessage(new ApiError('Custom message', 400))).toBe('Custom message');
  });

  it('returns fallback for ApiError with empty message', () => {
    const err = new ApiError('', 400);
    expect(getApiErrorMessage(err)).toBe('Ein unbekannter Fehler ist aufgetreten.');
  });

  it('returns error.message for regular Error', () => {
    expect(getApiErrorMessage(new Error('network error'))).toBe('network error');
  });

  it('returns custom fallback for unknown error', () => {
    expect(getApiErrorMessage({}, 'Custom fallback')).toBe('Custom fallback');
  });

  it('returns default fallback for non-error value', () => {
    expect(getApiErrorMessage(42)).toBe('Ein unbekannter Fehler ist aufgetreten.');
  });
});

// ─── apiRequest ──────────────────────────────────────────────────────────────

describe('apiRequest', () => {
  beforeEach(() => {
    // Reset cookies and fetch mock
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls fetch with the correct URL', async () => {
    mockFetchOk({});
    await apiRequest('/api/test');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/test',
      expect.any(Object),
    );
  });

  it('prepends / when endpoint does not start with /', async () => {
    mockFetchOk({});
    await apiRequest('api/test');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/api/test',
      expect.any(Object),
    );
  });

  it('uses GET as default method', async () => {
    mockFetchOk({});
    await apiRequest('/api/test');
    const callArg = (fetch as jest.Mock).mock.calls[0][1];
    expect(callArg.method).toBe('GET');
  });

  it('uses provided method', async () => {
    mockFetchOk({});
    await apiRequest('/api/test', { method: 'POST' });
    const callArg = (fetch as jest.Mock).mock.calls[0][1];
    expect(callArg.method).toBe('POST');
  });

  it('sets Content-Type to application/json for JSON body', async () => {
    mockFetchOk({});
    await apiRequest('/api/test', { method: 'POST', body: { foo: 'bar' } });
    const callArg = (fetch as jest.Mock).mock.calls[0][1];
    expect(callArg.headers['Content-Type']).toBe('application/json');
  });

  it('JSON-encodes the body', async () => {
    mockFetchOk({});
    await apiRequest('/api/test', { method: 'POST', body: { key: 'value' } });
    const callArg = (fetch as jest.Mock).mock.calls[0][1];
    expect(callArg.body).toBe('{"key":"value"}');
  });

  it('does not set body for GET', async () => {
    mockFetchOk({});
    await apiRequest('/api/test', { method: 'GET', body: { foo: 'bar' } } as any);
    const callArg = (fetch as jest.Mock).mock.calls[0][1];
    expect(callArg.body).toBeUndefined();
  });

  it('sets credentials to include', async () => {
    mockFetchOk({});
    await apiRequest('/api/test');
    const callArg = (fetch as jest.Mock).mock.calls[0][1];
    expect(callArg.credentials).toBe('include');
  });

  it('returns the response object', async () => {
    const res = mockFetchOk({ ok: true });
    const result = await apiRequest('/api/test');
    expect(result).toBe(res);
  });

  it('logs warning on 401 response', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetchStatus(401, {});
    await apiRequest('/api/test');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('401'));
  });
});

// ─── apiJson ─────────────────────────────────────────────────────────────────

describe('apiJson', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns parsed JSON on success', async () => {
    mockFetchOk({ items: [1, 2] });
    const result = await apiJson('/api/items');
    expect(result).toEqual({ items: [1, 2] });
  });

  it('throws ApiError with server error message from data.error', async () => {
    mockFetchStatus(422, { error: 'Validation failed' });
    await expect(apiJson('/api/test')).rejects.toThrow('Validation failed');
  });

  it('throws ApiError with data.message when no data.error', async () => {
    mockFetchStatus(400, { message: 'Bad input' });
    await expect(apiJson('/api/test')).rejects.toThrow('Bad input');
  });

  it('throws ApiError with HTTP status fallback when no message/error', async () => {
    mockFetchStatus(500, {});
    await expect(apiJson('/api/test')).rejects.toThrow('HTTP 500');
  });

  it('throws ApiError with correct status code', async () => {
    mockFetchStatus(404, { error: 'not found' });
    try {
      await apiJson('/api/test');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
    }
  });

  it('throws ApiError when response body is not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeFakeResponse('not json', 200));
    await expect(apiJson('/api/test')).rejects.toThrow(ApiError);
  });
});

// ─── apiBlob ─────────────────────────────────────────────────────────────────

describe('apiBlob', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a Blob on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeFakeResponse('pdf content', 200));
    const result = await apiBlob('/api/file.pdf');
    expect(result).toBeInstanceOf(Blob);
  });

  it('throws ApiError on non-ok response with JSON error', async () => {
    mockFetchStatus(403, { error: 'Access denied' });
    await expect(apiBlob('/api/file.pdf')).rejects.toThrow(ApiError);
  });

  it('throws ApiError with HTTP status when body not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeFakeResponse('not json', 404));
    await expect(apiBlob('/api/file.pdf')).rejects.toThrow(ApiError);
  });
});
