import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureHttpApp } from './common/infrastructure/http/configure-http-app.js';
import { createOpenApiDocument } from './common/infrastructure/http/openapi.js';
import { AppLogger, logLevelsFrom } from './common/infrastructure/logging/app-logger.js';
import { requestLoggingMiddleware } from './common/infrastructure/logging/request-logging.middleware.js';
import { ErrorLogsService } from './observability/application/error-logs/error-logs.service.js';

async function bootstrap() {
  // Show startup logs immediately, including failures before AppLogger is ready.
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const logger = new AppLogger({
    json: config.get<string>('LOG_FORMAT', isProduction ? 'json' : 'text') === 'json',
    logLevels: logLevelsFrom(config.get<string>('LOG_LEVEL')),
  });
  // From here on, every error logged is also stored in error_logs.
  logger.attachErrorSink(app.get(ErrorLogsService));
  app.useLogger(logger);
  app.use(requestLoggingMiddleware);

  app.enableCors({
    origin: true,
  });

  configureHttpApp(app);

  SwaggerModule.setup('docs', app, createOpenApiDocument(app));

  await app.listen(process.env.PORT ?? 3000);
}
// Last resort: an error nobody awaited would otherwise vanish without a trace.
const processLogger = new Logger('Process');
process.on('unhandledRejection', (reason) => {
  processLogger.error(
    'Unhandled promise rejection',
    reason instanceof Error ? reason.stack : String(reason),
  );
});
process.on('uncaughtException', (error) => {
  processLogger.fatal('Uncaught exception', error.stack);
  // Gives the error_logs insert a moment before exiting.
  setTimeout(() => process.exit(1), 1000);
});

await bootstrap();
