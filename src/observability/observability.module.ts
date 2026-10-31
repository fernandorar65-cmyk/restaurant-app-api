import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLogsService } from './application/error-logs/error-logs.service.js';
import { ERROR_LOG_REPOSITORY } from './domain/repositories/error-log.repository.js';
import { PlatformErrorLogsController } from './infrastructure/http/controllers/platform-error-logs.controller.js';
import { ErrorLogOrmEntity } from './infrastructure/persistence/typeorm/entities/error-log.orm-entity.js';
import { TypeOrmErrorLogRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-error-log.repository.js';
import { ErrorLogRetentionTask } from './infrastructure/scheduling/error-log-retention.task.js';

/**
 * Errors logged by the application, stored in error_logs. main.ts attaches
 * ErrorLogsService to the logger as its ErrorSink.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ErrorLogOrmEntity])],
  controllers: [PlatformErrorLogsController],
  providers: [
    ErrorLogsService,
    ErrorLogRetentionTask,
    { provide: ERROR_LOG_REPOSITORY, useClass: TypeOrmErrorLogRepository },
  ],
  exports: [ErrorLogsService],
})
export class ObservabilityModule {}
