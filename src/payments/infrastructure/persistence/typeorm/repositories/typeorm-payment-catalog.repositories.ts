import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import {
  transactionalRepository,
  withoutUndefined,
} from '../../../../../common/persistence/typeorm-base.repository.js';
import { PaymentStatus } from '../../../../domain/entities/payment-status.entity.js';
import { ProviderEvent } from '../../../../domain/entities/provider-event.entity.js';
import { ProviderStatusMapping } from '../../../../domain/entities/provider-status-mapping.entity.js';
import type { PaymentStatusCode } from '../../../../domain/enums/payment-status-code.enum.js';
import type {
  PaymentStatusRepository,
  ProviderEventRepository,
  ProviderStatusMappingRepository,
} from '../../../../domain/repositories/payment-catalog.repository.js';
import type {
  PaymentStatusDefinition,
  RefundStatusDefinition,
} from '../../../../domain/status-catalog.js';
import { PaymentProviderEventOrmEntity } from '../entities/payment-provider-event.orm-entity.js';
import { PaymentProviderStatusMappingOrmEntity } from '../entities/payment-provider-status-mapping.orm-entity.js';
import { PaymentStatusOrmEntity } from '../entities/payment-status.orm-entity.js';
import { RefundStatusOrmEntity } from '../entities/refund-status.orm-entity.js';
import {
  PaymentStatusMapper,
  ProviderEventMapper,
  ProviderStatusMappingMapper,
} from '../mappers/payment.mappers.js';

@Injectable()
export class TypeOrmPaymentStatusRepository implements PaymentStatusRepository {
  constructor(
    @InjectRepository(PaymentStatusOrmEntity)
    private readonly statuses: Repository<PaymentStatusOrmEntity>,
    @InjectRepository(RefundStatusOrmEntity)
    private readonly refundStatuses: Repository<RefundStatusOrmEntity>,
  ) {}

  async findAll(): Promise<PaymentStatus[]> {
    const rows = await this.statuses.find({ order: { createdAt: 'ASC', code: 'ASC' } });
    return rows.map((row) => PaymentStatusMapper.toDomain(row));
  }

  async findByCode(code: PaymentStatusCode): Promise<PaymentStatus | null> {
    const found = await this.statuses.findOne({ where: { code } });
    return found ? PaymentStatusMapper.toDomain(found) : null;
  }

  async save(status: PaymentStatus): Promise<PaymentStatus> {
    await this.statuses.update(
      { id: status.id },
      { name: status.name, description: status.description },
    );
    return (await this.findByCode(status.code)) as PaymentStatus;
  }

  async ensureCatalog(
    payments: PaymentStatusDefinition[],
    refunds: RefundStatusDefinition[],
  ): Promise<void> {
    for (const definition of payments) {
      const flags = {
        isTerminal: definition.isTerminal,
        countsTowardBalance: definition.countsTowardBalance,
        allowsRefund: definition.allowsRefund,
      };
      const existing = await this.statuses.findOne({ where: { code: definition.code } });
      if (existing) {
        await this.statuses.update({ id: existing.id }, flags);
      } else {
        await this.statuses.insert({
          code: definition.code,
          name: definition.name,
          description: definition.description,
          ...flags,
        });
      }
    }
    for (const definition of refunds) {
      const flags = {
        isTerminal: definition.isTerminal,
        countsAsRefunded: definition.countsAsRefunded,
      };
      const existing = await this.refundStatuses.findOne({ where: { code: definition.code } });
      if (existing) {
        await this.refundStatuses.update({ id: existing.id }, flags);
      } else {
        await this.refundStatuses.insert({
          code: definition.code,
          name: definition.name,
          description: definition.description,
          ...flags,
        });
      }
    }
  }
}

@Injectable()
export class TypeOrmProviderStatusMappingRepository implements ProviderStatusMappingRepository {
  constructor(
    @InjectRepository(PaymentProviderStatusMappingOrmEntity)
    private readonly mappings: Repository<PaymentProviderStatusMappingOrmEntity>,
    @InjectRepository(PaymentStatusOrmEntity)
    private readonly statuses: Repository<PaymentStatusOrmEntity>,
  ) {}

  async findById(id: string): Promise<ProviderStatusMapping | null> {
    const found = await this.mappings.findOne({ where: { id } });
    return found ? ProviderStatusMappingMapper.toDomain(found) : null;
  }

  /** citext column: the comparison already ignores case. */
  async find(providerCode: string, externalStatus: string): Promise<ProviderStatusMapping | null> {
    const found = await this.mappings.findOne({ where: { providerCode, externalStatus } });
    return found ? ProviderStatusMappingMapper.toDomain(found) : null;
  }

  async findPage(
    filter: { providerCode?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<ProviderStatusMapping>> {
    const [rows, total] = await this.mappings.findAndCount({
      where: withoutUndefined({ providerCode: filter.providerCode, isActive: filter.isActive }),
      order: { providerCode: 'ASC', externalStatus: 'ASC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: rows.map((row) => ProviderStatusMappingMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async save(mapping: ProviderStatusMapping): Promise<ProviderStatusMapping> {
    const status = await this.statuses.findOneOrFail({ where: { code: mapping.paymentStatus } });
    await this.mappings.save({
      id: mapping.id,
      providerCode: mapping.providerCode,
      externalStatus: mapping.externalStatus,
      paymentStatusId: status.id,
      isActive: mapping.isActive,
    });
    return (await this.findById(mapping.id)) as ProviderStatusMapping;
  }
}

@Injectable()
export class TypeOrmProviderEventRepository implements ProviderEventRepository {
  constructor(
    @InjectRepository(PaymentProviderEventOrmEntity)
    private readonly events: Repository<PaymentProviderEventOrmEntity>,
  ) {}

  async findByEventId(providerCode: string, eventId: string): Promise<ProviderEvent | null> {
    const found = await this.events.findOne({ where: { providerCode, eventId } });
    return found ? ProviderEventMapper.toDomain(found) : null;
  }

  /** ON CONFLICT DO NOTHING: a duplicate must not abort the transaction. */
  async insertIfNew(event: ProviderEvent, tx: TransactionContext): Promise<boolean> {
    const result = await transactionalRepository(this.events, tx)
      .createQueryBuilder()
      .insert()
      .values(ProviderEventMapper.toPersistence(event) as QueryDeepPartialEntity<PaymentProviderEventOrmEntity>)
      .orIgnore()
      .returning('id')
      .execute();
    return (result.raw as unknown[]).length > 0;
  }

  async save(event: ProviderEvent, tx?: TransactionContext): Promise<void> {
    await transactionalRepository(this.events, tx).save(ProviderEventMapper.toPersistence(event));
  }

  async findPage(
    filter: { providerCode?: string },
    page: PageRequest,
  ): Promise<Page<ProviderEvent>> {
    const [rows, total] = await this.events.findAndCount({
      where: withoutUndefined({ providerCode: filter.providerCode }),
      order: { receivedAt: 'DESC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: rows.map((row) => ProviderEventMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }
}
