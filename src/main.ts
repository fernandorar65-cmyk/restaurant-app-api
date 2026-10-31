import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { validationExceptionFactory } from './common/infrastructure/http/validation-exception.factory.js';
import { AppLogger, logLevelsFrom } from './common/infrastructure/logging/app-logger.js';
import { requestLoggingMiddleware } from './common/infrastructure/logging/request-logging.middleware.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { ErrorLogsService } from './observability/application/error-logs/error-logs.service.js';

async function bootstrap() {
  // Startup logs are buffered until the logger can be built from the .env values.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Restaurant API')
    .setDescription('API para la gestión de un restaurante')
    .setVersion('1.0')
    .addBearerAuth()
    // Session is required by default; public routes are marked @Public().
    .addSecurityRequirements('bearer')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

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
