import { ErrorLog, type ErrorLogDetails } from './error-log.entity.js';

const details = (overrides: Partial<ErrorLogDetails> = {}): ErrorLogDetails => ({
  level: 'error',
  source: 'Service',
  message: 'boom',
  stack: null,
  requestId: null,
  method: null,
  path: null,
  statusCode: null,
  errorCode: null,
  userId: null,
  ...overrides,
});

describe('ErrorLog.record', () => {
  it('truncates oversized message, stack and path', () => {
    const log = ErrorLog.record(
      'id-1',
      details({ message: 'm'.repeat(5_000), stack: 's'.repeat(50_000), path: '/p'.repeat(400) }),
    );
    expect(log.message).toHaveLength(2_000);
    expect(log.message.endsWith('…')).toBe(true);
    expect(log.stack).toHaveLength(10_000);
    expect(log.path).toHaveLength(500);
  });

  it('never stores an empty message', () => {
    expect(ErrorLog.record('id-1', details({ message: '' })).message).toBe('(sin mensaje)');
  });

  it('keeps short values as they are', () => {
    const log = ErrorLog.record('id-1', details({ stack: 'Error: x', path: '/products' }));
    expect(log.message).toBe('boom');
    expect(log.stack).toBe('Error: x');
    expect(log.path).toBe('/products');
  });
});
