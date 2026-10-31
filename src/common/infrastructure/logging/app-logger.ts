import { ConsoleLogger } from '@nestjs/common';
import type { ConsoleLoggerOptions, LogLevel } from '@nestjs/common';
import type {
  ErrorLevel,
  ErrorSink,
} from '../../application/ports/error-sink.port.js';
import { currentRequestContext, currentRequestId } from './request-context.js';

// The access line of a failed request repeats an error already recorded by
// whoever reported it (usually the exception filter).
const NOT_RECORDED_SOURCES = new Set(['HTTP']);

/** Most to least severe; LOG_LEVEL=warn enables fatal, error and warn. */
const LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

export function logLevelsFrom(level: string | undefined): LogLevel[] {
  const index = LEVELS.indexOf((level ?? 'log') as LogLevel);
  return LEVELS.slice(0, index === -1 ? LEVELS.indexOf('log') + 1 : index + 1);
}

/**
 * Nest's console logger plus the id of the current request, so every line
 * written while serving a request (by any context) can be traced back to it.
 * JSON output is meant for production log collectors; text for local dev.
 * Errors are also handed to an ErrorSink (the error_logs table) once the
 * application has started.
 */
export class AppLogger extends ConsoleLogger {
  private errorSink?: ErrorSink;

  constructor(options: ConsoleLoggerOptions) {
    super(options);
  }

  attachErrorSink(sink: ErrorSink): void {
    this.errorSink = sink;
  }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams);
    this.record('error', [message, ...optionalParams]);
  }

  override fatal(message: unknown, ...optionalParams: unknown[]): void {
    super.fatal(message, ...optionalParams);
    this.record('fatal', [message, ...optionalParams]);
  }

  /** Errors are recorded even when LOG_LEVEL hides them from the console. */
  private record(level: ErrorLevel, args: unknown[]): void {
    if (!this.errorSink) {
      return;
    }
    const { messages, context, stack } = this.getContextAndStackAndMessagesToPrint(args);
    if (context && NOT_RECORDED_SOURCES.has(context)) {
      return;
    }
    const firstError = messages.find((item): item is Error => item instanceof Error);
    const request = currentRequestContext();
    const entry = {
      level,
      source: context ?? null,
      message: messages.map((item) => describe(item)).join(' '),
      stack: stack ?? firstError?.stack ?? null,
      requestId: request?.requestId ?? null,
      method: request?.method ?? null,
      path: request?.path?.() ?? null,
      statusCode: request?.failure?.statusCode ?? null,
      errorCode: request?.failure?.errorCode ?? null,
      userId: request?.userId?.() ?? null,
    };
    this.errorSink.record(entry).catch((failure: unknown) => {
      // Straight to the console: going through error() again could loop.
      ConsoleLogger.prototype.error.call(
        this,
        'No se pudo guardar el error en error_logs',
        failure instanceof Error ? failure.stack : String(failure),
        AppLogger.name,
      );
    });
  }

  protected override formatContext(context: string): string {
    const requestId = currentRequestId();
    const base = super.formatContext(context);
    return requestId ? `${base}[${requestId.slice(0, 8)}] ` : base;
  }

  protected override getJsonLogObject(
    message: unknown,
    options: Parameters<ConsoleLogger['getJsonLogObject']>[1],
  ): ReturnType<ConsoleLogger['getJsonLogObject']> {
    const logObject = super.getJsonLogObject(message, options);
    const requestId = currentRequestId();
    if (!requestId) {
      return logObject;
    }
    // Before the stack, which can be long, so the id stays visible.
    const { stack, ...rest } = logObject;
    return stack === undefined ? { ...rest, requestId } : { ...rest, requestId, stack };
  }
}

function describe(item: unknown): string {
  if (typeof item === 'string') {
    return item;
  }
  if (item instanceof Error) {
    return item.message;
  }
  try {
    return JSON.stringify(item);
  } catch {
    return String(item);
  }
}
