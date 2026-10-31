import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { runWithRequestContext, type RequestContext } from './request-context.js';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Set by the exception filter so the access log shows why a request failed. */
export const ERROR_CODE_LOCAL = 'errorCode';

// A caller-provided id is reused (e.g. from a gateway) only if it looks safe to log.
const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

// Path params that are credentials and must never reach the logs.
const SECRET_PARAMS = ['token'];

const logger = new Logger('HTTP');

export function resolveRequestId(incoming: string | string[] | undefined): string {
  return typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming)
    ? incoming
    : randomUUID();
}

/** Path without query string and with secret params masked. */
export function loggablePath(request: Request): string {
  let path = (request.originalUrl ?? request.url).split('?')[0];
  for (const name of SECRET_PARAMS) {
    const value: unknown = request.params?.[name];
    if (typeof value === 'string' && value) {
      path = path.replace(value, '***');
    }
  }
  return path;
}

/**
 * Assigns a request id (returned in the X-Request-Id header) and writes one
 * access line per request when the response finishes: method, path, status,
 * error code, duration and user. Bodies are never logged: they carry passwords
 * and personal data.
 */
export function requestLoggingMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);
  const startedAt = process.hrtime.bigint();
  response.setHeader(REQUEST_ID_HEADER, requestId);

  const context: RequestContext = {
    requestId,
    method: request.method,
    path: () => loggablePath(request),
    userId: () => (request as Request & { user?: { id: string } }).user?.id,
  };
  // 'finish' is emitted outside the request's async context, so it is
  // re-entered explicitly for the access line to carry the request id.
  response.on('finish', () =>
    runWithRequestContext(context, () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const userId = context.userId?.();
      const errorCode = response.locals[ERROR_CODE_LOCAL] as string | undefined;
      const line = [
        request.method,
        loggablePath(request),
        response.statusCode,
        errorCode,
        `${durationMs.toFixed(1)}ms`,
        userId ? `user=${userId}` : undefined,
      ]
        .filter((part) => part !== undefined)
        .join(' ');
      if (response.statusCode >= 500) {
        logger.error(line);
      } else if (response.statusCode >= 400) {
        logger.warn(line);
      } else {
        logger.log(line);
      }
    }),
  );
  runWithRequestContext(context, next);
}
