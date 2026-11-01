import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { TransformInterceptor } from './transform.interceptor.js';
import { validationExceptionFactory } from './validation-exception.factory.js';

/**
 * Validation, response envelope and error mapping of the HTTP API. Shared by
 * main.ts and the e2e tests, so tests exercise the same behaviour.
 */
export function configureHttpApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
}
