import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ConflictDomainError,
  NotFoundDomainError,
  ValidationDomainError,
} from '../domain/domain-error.js';

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
    return HttpStatus.INTERNAL_SERVER_ERROR;
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
    if (
      exception instanceof NotFoundDomainError ||
      exception instanceof ConflictDomainError ||
      exception instanceof ValidationDomainError
    ) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
