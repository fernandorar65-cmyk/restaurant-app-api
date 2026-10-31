import type { Request } from 'express';
import { logLevelsFrom } from './app-logger.js';
import { currentRequestId, runWithRequestContext } from './request-context.js';
import { loggablePath, resolveRequestId } from './request-logging.middleware.js';

describe('resolveRequestId', () => {
  it('reuses a safe id sent by the caller', () => {
    expect(resolveRequestId('gateway-req-1234')).toBe('gateway-req-1234');
  });

  it('generates a new id when the header is missing, repeated or unsafe', () => {
    for (const incoming of [undefined, ['a1b2c3d4e5', 'f6g7h8i9j0'], 'short', 'bad id\nINJECTED']) {
      const id = resolveRequestId(incoming);
      expect(id).not.toBe(incoming);
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    }
  });
});

describe('loggablePath', () => {
  const request = (originalUrl: string, params: Record<string, string> = {}) =>
    ({ originalUrl, url: originalUrl, params }) as unknown as Request;

  it('drops the query string', () => {
    expect(loggablePath(request('/attentions?restaurantId=abc&page=2'))).toBe('/attentions');
  });

  it('masks the QR token', () => {
    expect(
      loggablePath(request('/api/v1/tables/qr/0R429DEs_r04', { token: '0R429DEs_r04' })),
    ).toBe('/api/v1/tables/qr/***');
  });
});

describe('logLevelsFrom', () => {
  it('enables the given level and every more severe one', () => {
    expect(logLevelsFrom('warn')).toEqual(['fatal', 'error', 'warn']);
  });

  it('defaults to log', () => {
    expect(logLevelsFrom(undefined)).toEqual(['fatal', 'error', 'warn', 'log']);
    expect(logLevelsFrom('nonsense')).toEqual(['fatal', 'error', 'warn', 'log']);
  });
});

describe('request context', () => {
  it('is visible across awaits inside the request and gone outside', async () => {
    const seen = await runWithRequestContext({ requestId: 'req-12345678' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return currentRequestId();
    });
    expect(seen).toBe('req-12345678');
    expect(currentRequestId()).toBeUndefined();
  });
});
