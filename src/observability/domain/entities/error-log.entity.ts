// Bounds per field: a runaway message or stack must not bloat the table.
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_STACK_LENGTH = 10_000;
const MAX_PATH_LENGTH = 500;

export type ErrorLogLevel = 'error' | 'fatal';

/** What was logged and, when it happened while serving a request, which one. */
export interface ErrorLogDetails {
  level: ErrorLogLevel;
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

export interface ErrorLogProps extends ErrorLogDetails {
  id: string;
  createdAt: Date;
}

/** An error the application logged, kept for later diagnosis. Immutable. */
export class ErrorLog {
  private constructor(private readonly props: ErrorLogProps) {}

  static record(id: string, entry: ErrorLogDetails): ErrorLog {
    return new ErrorLog({
      ...entry,
      id,
      message: truncate(entry.message, MAX_MESSAGE_LENGTH) || '(sin mensaje)',
      stack: entry.stack === null ? null : truncate(entry.stack, MAX_STACK_LENGTH),
      path: entry.path === null ? null : truncate(entry.path, MAX_PATH_LENGTH),
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: ErrorLogProps): ErrorLog {
    return new ErrorLog(props);
  }

  get id(): string {
    return this.props.id;
  }
  get level(): ErrorLogLevel {
    return this.props.level;
  }
  get source(): string | null {
    return this.props.source;
  }
  get message(): string {
    return this.props.message;
  }
  get stack(): string | null {
    return this.props.stack;
  }
  get requestId(): string | null {
    return this.props.requestId;
  }
  get method(): string | null {
    return this.props.method;
  }
  get path(): string | null {
    return this.props.path;
  }
  get statusCode(): number | null {
    return this.props.statusCode;
  }
  get errorCode(): string | null {
    return this.props.errorCode;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
