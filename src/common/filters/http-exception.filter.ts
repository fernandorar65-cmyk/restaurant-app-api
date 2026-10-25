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
const POSTGRES_ERRORS: Record<string, { status: number; message: string }> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'Ya existe un registro con esos datos',
  },
  '23503': {
    status: HttpStatus.CONFLICT,
    message: 'El registro referencia o es referenciado por datos que no lo permiten',
  },
  '23514': {
    status: HttpStatus.BAD_REQUEST,
    message: 'Los datos no cumplen las reglas del modelo',
  },
};

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

  private extractMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      const message = (response as { message?: string | string[] }).message;
      return message ?? exception.message;
    }
    if (DOMAIN_ERROR_TYPES.some((type) => exception instanceof type)) {
      return (exception as Error).message;
    }
    return postgresError(exception)?.message ?? 'Internal server error';
  }
}
