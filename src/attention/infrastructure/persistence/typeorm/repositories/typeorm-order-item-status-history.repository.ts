import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { OrderItemStatusHistory } from '../../../../domain/entities/order-item-status-history.entity.js';
import { OrderItemStatusHistoryRepository } from '../../../../domain/repositories/order-item-status-history.repository.js';
import { OrderItemStatusHistoryOrmEntity } from '../entities/order-item-status-history.orm-entity.js';
import { OrderItemStatusHistoryMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmOrderItemStatusHistoryRepository
  implements OrderItemStatusHistoryRepository
{
  constructor(
    @InjectRepository(OrderItemStatusHistoryOrmEntity)
    private readonly repository: Repository<OrderItemStatusHistoryOrmEntity>,
  ) {}

  async findByItem(orderItemId: string): Promise<OrderItemStatusHistory[]> {
    const rows = await this.repository.find({
      where: { orderItemId },
      order: { changedAt: 'ASC' },
    });
    return rows.map((row) => OrderItemStatusHistoryMapper.toDomain(row));
  }

  async save(
    entry: OrderItemStatusHistory,
    tx?: TransactionContext,
  ): Promise<OrderItemStatusHistory> {
    const saved = await transactionalRepository(this.repository, tx).save(
      OrderItemStatusHistoryMapper.toPersistence(entry),
    );
    return OrderItemStatusHistoryMapper.toDomain(saved);
  }
}
