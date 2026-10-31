export type ErrorLevel = 'error' | 'fatal';

/** An error written to the logs, with the request it happened in (if any). */
export interface ErrorLogEntry {
  level: ErrorLevel;
  /** Logger context, e.g. HttpExceptionFilter or OrderItemsService. */
  source: string | null;
  message: string;
  stack: string | null;
  requestId: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  errorCode: string | null;
  userId: string | null;
}

/**
 * Durable destination for errors, in addition to the console. Implementations
 * must never throw back into the caller: logging an error can't cause another.
 */
export interface ErrorSink {
  record(entry: ErrorLogEntry): Promise<void>;
}
