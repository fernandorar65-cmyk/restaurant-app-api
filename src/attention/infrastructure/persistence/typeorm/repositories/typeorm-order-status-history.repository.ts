import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { OrderStatusHistory } from '../../../../domain/entities/order-status-history.entity.js';
import { OrderStatusHistoryRepository } from '../../../../domain/repositories/order-status-history.repository.js';
import type { TransactionContext } from '../../../../domain/transaction-context.js';
import { OrderStatusHistoryOrmEntity } from '../entities/order-status-history.orm-entity.js';
import { OrderStatusHistoryMapper } from '../mappers/order-status-history.mapper.js';
import { TypeOrmTransactionContext } from '../typeorm-transaction-runner.js';

@Injectable()
export class TypeOrmOrderStatusHistoryRepository
  extends TypeOrmBaseRepository<OrderStatusHistory, OrderStatusHistoryOrmEntity>
  implements OrderStatusHistoryRepository
{
  constructor(
    @InjectRepository(OrderStatusHistoryOrmEntity)
    repository: Repository<OrderStatusHistoryOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: OrderStatusHistoryOrmEntity): OrderStatusHistory {
    return OrderStatusHistoryMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: OrderStatusHistory,
    existing?: OrderStatusHistoryOrmEntity,
  ): OrderStatusHistoryOrmEntity {
    return OrderStatusHistoryMapper.toPersistence(domain, existing);
  }

  protected override getRepository(
    tx?: TransactionContext,
  ): Repository<OrderStatusHistoryOrmEntity> {
    if (tx instanceof TypeOrmTransactionContext) {
      return tx.manager.getRepository(OrderStatusHistoryOrmEntity);
    }
    return this.repository;
  }
}
