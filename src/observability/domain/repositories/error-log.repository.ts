import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { ErrorLog, type ErrorLogLevel } from '../entities/error-log.entity.js';

export const ERROR_LOG_REPOSITORY = Symbol('ERROR_LOG_REPOSITORY');

export interface ErrorLogFilter {
  level?: ErrorLogLevel;
  requestId?: string;
  errorCode?: string;
  userId?: string;
  /** Inclusive date range 'YYYY-MM-DD' (UTC). */
  from?: string;
  to?: string;
}

export interface ErrorLogRepository {
  findById(id: string): Promise<ErrorLog | null>;
  /** Newest first. */
  findPage(filter: ErrorLogFilter, page: PageRequest): Promise<Page<ErrorLog>>;
  insert(errorLog: ErrorLog): Promise<void>;
  /** Returns how many were removed. */
  deleteOlderThan(date: Date): Promise<number>;
}
