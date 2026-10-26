import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import {
  BusinessRuleDomainError,
  ConflictDomainError,
  DomainError,
  ForbiddenDomainError,
  NotFoundDomainError,
  UnauthorizedDomainError,
  ValidationDomainError,
} from '../domain/domain-error.js';

const DOMAIN_ERROR_TYPES = [
  NotFoundDomainError,
  ConflictDomainError,
  ValidationDomainError,
  UnauthorizedDomainError,
  ForbiddenDomainError,
  BusinessRuleDomainError,
] as const;

// Postgres error codes that are a client problem, not a server bug. They are
// the last line of defense: services check what they can before writing, but
// constraints still catch races (e.g. two concurrent inserts).
const POSTGRES_ERRORS: Record<
  string,
  { status: number; message: string; errorCode: string }
> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'Ya existe un registro con esos datos',
    errorCode: 'DUPLICATE_RECORD',
  },
  '23503': {
    status: HttpStatus.CONFLICT,
    message: 'El registro referencia o es referenciado por datos que no lo permiten',
    errorCode: 'REFERENCE_CONFLICT',
  },
  '23514': {
    status: HttpStatus.BAD_REQUEST,
    message: 'Los datos no cumplen las reglas del modelo',
    errorCode: 'CONSTRAINT_VIOLATION',
  },
};

// Fallback codes for framework exceptions (validation pipe, guards, routing).
const HTTP_ERROR_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

// Fixed messages of Nest's built-in pipes and router, translated.
const FRAMEWORK_MESSAGES: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^Validation failed \(uuid.*is expected\)$/, () => 'El identificador debe ser un UUID válido'],
  [/^Validation failed \(enum string is expected\)$/, () => 'Valor no permitido para este parámetro'],
  [/^Validation failed \(boolean string is expected\)$/, () => 'El parámetro debe ser true o false'],
  [/^Validation failed \(numeric string is expected\)$/, () => 'El parámetro debe ser numérico'],
  [/^Cannot (\w+) (.+)$/, (m) => `Ruta no encontrada: ${m[1]} ${m[2]}`],
];

function translateFrameworkMessage(message: string): string {
  for (const [pattern, translate] of FRAMEWORK_MESSAGES) {
    const match = message.match(pattern);
    if (match) {
      return translate(match);
    }
  }
  return message;
}

function postgresError(exception: unknown) {
  if (!(exception instanceof QueryFailedError)) {
    return undefined;
  }
  const code = (exception.driverError as { code?: string } | undefined)?.code;
  return code ? POSTGRES_ERRORS[code] : undefined;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.resolveStatus(exception);
    const message = this.extractMessage(exception);

    response.status(statusCode).json({
      success: false,
      statusCode,
      errorCode: this.resolveErrorCode(exception, statusCode),
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof NotFoundDomainError) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ConflictDomainError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof ValidationDomainError) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof UnauthorizedDomainError) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (exception instanceof ForbiddenDomainError) {
      return HttpStatus.FORBIDDEN;
    }
    if (exception instanceof BusinessRuleDomainError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    return postgresError(exception)?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /** Stable, machine-readable code; clients should branch on it, not on message. */
  private resolveErrorCode(exception: unknown, statusCode: number): string {
    if (exception instanceof DomainError) {
      return exception.code;
    }
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const explicit =
        typeof response === 'object'
          ? (response as { errorCode?: string }).errorCode
          : undefined;
      return explicit ?? HTTP_ERROR_CODES[statusCode] ?? 'HTTP_ERROR';
    }
    return postgresError(exception)?.errorCode ?? 'INTERNAL_ERROR';
  }

  private extractMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return translateFrameworkMessage(response);
      }
      const message = (response as { message?: string | string[] }).message;
      if (typeof message === 'string') {
        return translateFrameworkMessage(message);
      }
      return message ?? translateFrameworkMessage(exception.message);
    }
    if (DOMAIN_ERROR_TYPES.some((type) => exception instanceof type)) {
      return (exception as Error).message;
    }
    return postgresError(exception)?.message ?? 'Error interno del servidor';
  }
}
