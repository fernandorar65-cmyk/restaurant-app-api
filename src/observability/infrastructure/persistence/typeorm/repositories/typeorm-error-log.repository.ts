import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { ErrorLog } from '../../../../domain/entities/error-log.entity.js';
import type {
  ErrorLogFilter,
  ErrorLogRepository,
} from '../../../../domain/repositories/error-log.repository.js';
import { ErrorLogOrmEntity } from '../entities/error-log.orm-entity.js';
import { ErrorLogMapper } from '../mappers/error-log.mapper.js';

@Injectable()
export class TypeOrmErrorLogRepository implements ErrorLogRepository {
  constructor(
    @InjectRepository(ErrorLogOrmEntity)
    private readonly repository: Repository<ErrorLogOrmEntity>,
  ) {}

  async findById(id: string): Promise<ErrorLog | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? ErrorLogMapper.toDomain(found) : null;
  }

  async findPage(filter: ErrorLogFilter, page: PageRequest): Promise<Page<ErrorLog>> {
    const query = this.repository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page.page - 1) * page.limit)
      .take(page.limit);
    if (filter.level) {
      query.andWhere('log.level = :level', { level: filter.level });
    }
    if (filter.requestId) {
      query.andWhere('log.request_id = :requestId', { requestId: filter.requestId });
    }
    if (filter.errorCode) {
      query.andWhere('log.error_code = :errorCode', { errorCode: filter.errorCode });
    }
    if (filter.userId) {
      query.andWhere('log.user_id = :userId', { userId: filter.userId });
    }
    // Whole days in UTC: 'to' includes everything logged on that date.
    if (filter.from) {
      query.andWhere(`log.created_at >= (:from::date AT TIME ZONE 'UTC')`, {
        from: filter.from,
      });
    }
    if (filter.to) {
      query.andWhere(`log.created_at < ((:to::date + 1) AT TIME ZONE 'UTC')`, {
        to: filter.to,
      });
    }
    const [rows, total] = await query.getManyAndCount();
    return {
      items: rows.map((row) => ErrorLogMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async insert(errorLog: ErrorLog): Promise<void> {
    await this.repository.insert(ErrorLogMapper.toPersistence(errorLog));
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.repository.delete({ createdAt: LessThan(date) });
    return result.affected ?? 0;
  }
}
