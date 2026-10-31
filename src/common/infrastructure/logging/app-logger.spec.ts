import { ConsoleLogger } from '@nestjs/common';
import type { ErrorLogEntry, ErrorSink } from '../../application/ports/error-sink.port.js';
import { AppLogger } from './app-logger.js';
import { runWithRequestContext } from './request-context.js';

function loggerWithSink(record: ErrorSink['record'] = () => Promise.resolve()) {
  const logger = new AppLogger({ logLevels: [] }); // silent console
  const entries: ErrorLogEntry[] = [];
  logger.attachErrorSink({
    record: (entry) => {
      entries.push(entry);
      return record(entry);
    },
  });
  return { logger, entries };
}

describe('AppLogger error sink', () => {
  it('records errors with the request they happened in', () => {
    const { logger, entries } = loggerWithSink();
    runWithRequestContext(
      {
        requestId: 'req-12345678',
        method: 'POST',
        path: () => '/products',
        userId: () => 'user-1',
        failure: { statusCode: 500, errorCode: 'INTERNAL_ERROR' },
      },
      () => logger.error('POST /products → INTERNAL_ERROR', 'Error: boom\n    at x', 'Filter'),
    );
    expect(entries).toEqual([
      {
        level: 'error',
        source: 'Filter',
        message: 'POST /products → INTERNAL_ERROR',
        stack: 'Error: boom\n    at x',
        requestId: 'req-12345678',
        method: 'POST',
        path: '/products',
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        userId: 'user-1',
      },
    ]);
  });

  it('records errors outside a request and fatal ones', () => {
    const { logger, entries } = loggerWithSink();
    logger.fatal('Uncaught exception', 'Process');
    expect(entries).toMatchObject([
      { level: 'fatal', source: 'Process', message: 'Uncaught exception', requestId: null },
    ]);
  });

  it('skips the HTTP access line, already recorded by the filter', () => {
    const { logger, entries } = loggerWithSink();
    logger.error('POST /products 500 INTERNAL_ERROR 4.5ms', 'HTTP');
    expect(entries).toEqual([]);
  });

  it('ignores warnings', () => {
    const { logger, entries } = loggerWithSink();
    logger.warn('GET /x 404 NOT_FOUND', 'HTTP');
    logger.warn('algo raro', 'Service');
    expect(entries).toEqual([]);
  });

  it('reports a failed write to the console without recording it again', async () => {
    const consoleError = vi.spyOn(ConsoleLogger.prototype, 'error');
    const { logger, entries } = loggerWithSink(() => Promise.reject(new Error('db down')));
    logger.error('boom', 'Service');
    await new Promise((resolve) => setImmediate(resolve));
    expect(entries).toHaveLength(1);
    expect(consoleError).toHaveBeenLastCalledWith(
      'No se pudo guardar el error en error_logs',
      expect.stringContaining('db down'),
      'AppLogger',
    );
    consoleError.mockRestore();
  });
});
