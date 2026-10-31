import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorLogsService } from '../../application/error-logs/error-logs.service.js';

const DEFAULT_RETENTION_DAYS = 30;
const PURGE_EVERY_MS = 24 * 60 * 60 * 1000;

/**
 * Keeps error_logs bounded: deletes errors older than ERROR_LOG_RETENTION_DAYS
 * at startup and once a day after that.
 */
@Injectable()
export class ErrorLogRetentionTask implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ErrorLogRetentionTask.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly errorLogsService: ErrorLogsService,
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    void this.purge();
    // unref: the timer alone must not keep the process alive.
    this.timer = setInterval(() => void this.purge(), PURGE_EVERY_MS).unref();
  }

  onApplicationShutdown(): void {
    clearInterval(this.timer);
  }

  private async purge(): Promise<void> {
    const days = Number(
      this.configService.get<string>('ERROR_LOG_RETENTION_DAYS', String(DEFAULT_RETENTION_DAYS)),
    );
    try {
      const removed = await this.errorLogsService.purgeOlderThan(days);
      if (removed > 0) {
        this.logger.log(`Se eliminaron ${removed} errores con más de ${days} días`);
      }
    } catch (error) {
      // warn, not error: a failed cleanup must not be recorded as an error log.
      this.logger.warn(
        `No se pudo limpiar error_logs: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
