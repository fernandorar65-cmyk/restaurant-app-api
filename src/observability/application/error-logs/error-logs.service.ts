import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import type {
  ErrorLogEntry,
  ErrorSink,
} from '../../../common/application/ports/error-sink.port.js';
import { ErrorLog } from '../../domain/entities/error-log.entity.js';
import { ErrorLogNotFoundError } from '../../domain/exceptions/error-log.errors.js';
import { ERROR_LOG_REPOSITORY } from '../../domain/repositories/error-log.repository.js';
import type {
  ErrorLogFilter,
  ErrorLogRepository,
} from '../../domain/repositories/error-log.repository.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Errors logged by the application (via the logger's ErrorSink), kept in the
 * database so they can be reviewed after the console output is gone.
 */
@Injectable()
export class ErrorLogsService implements ErrorSink {
  constructor(
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository: ErrorLogRepository,
  ) {}

  /** Rejects only if the database write fails; the logger reports that. */
  record(entry: ErrorLogEntry): Promise<void> {
    return this.errorLogRepository.insert(ErrorLog.record(randomUUID(), entry));
  }

  findPage(filter: ErrorLogFilter, page: PageRequest): Promise<Page<ErrorLog>> {
    return this.errorLogRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<ErrorLog> {
    const errorLog = await this.errorLogRepository.findById(id);
    if (!errorLog) {
      throw new ErrorLogNotFoundError(id);
    }
    return errorLog;
  }

  /** Deletes the errors older than `days` days. */
  purgeOlderThan(days: number): Promise<number> {
    return this.errorLogRepository.deleteOlderThan(new Date(Date.now() - days * DAY_MS));
  }
}
