import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderItemStatus } from '../../../../domain/enums/order-item-status.enum.js';
import { OrderItemRepository } from '../../../../domain/repositories/order-item.repository.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';
import { OrderItemMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmOrderItemRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemOrmEntity)
    private readonly repository: Repository<OrderItemOrmEntity>,
  ) {}

  async findById(id: string, tx?: TransactionContext): Promise<OrderItem | null> {
    const found = await transactionalRepository(this.repository, tx).findOne({
      where: { id },
    });
    return found ? OrderItemMapper.toDomain(found) : null;
  }

  async findByBatch(batchId: string): Promise<OrderItem[]> {
    const rows = await this.repository.find({
      where: { batchId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => OrderItemMapper.toDomain(row));
  }

  async findByAttention(attentionId: string): Promise<OrderItem[]> {
    const rows = await this.repository
      .createQueryBuilder('item')
      .innerJoin('item.batch', 'batch')
      .where('batch.attention_id = :attentionId', { attentionId })
      .orderBy('item.created_at', 'ASC')
      .getMany();
    return rows.map((row) => OrderItemMapper.toDomain(row));
  }

  async findByRestaurant(
    restaurantId: string,
    statuses?: OrderItemStatus[],
  ): Promise<OrderItem[]> {
    const query = this.repository
      .createQueryBuilder('item')
      .innerJoin('item.batch', 'batch')
      .innerJoin('batch.attention', 'attention')
      .where('attention.restaurant_id = :restaurantId', { restaurantId })
      .orderBy('item.created_at', 'ASC');
    if (statuses?.length) {
      query.andWhere('item.current_status IN (:...statuses)', { statuses });
    }
    const rows = await query.getMany();
    return rows.map((row) => OrderItemMapper.toDomain(row));
  }

  async insert(item: OrderItem, tx?: TransactionContext): Promise<OrderItem> {
    const saved = await transactionalRepository(this.repository, tx).save(
      OrderItemMapper.toPersistence(item),
    );
    return OrderItemMapper.toDomain(saved);
  }

  async updateStatus(
    item: OrderItem,
    expectedVersion: number,
    tx?: TransactionContext,
  ): Promise<boolean> {
    // TypeORM bumps the @VersionColumn and updated_at on query-builder updates.
    const result = await transactionalRepository(this.repository, tx)
      .createQueryBuilder()
      .update(OrderItemOrmEntity)
      .set({
        currentStatus: item.currentStatus,
        rejectionReason: item.rejectionReason,
      })
      .where('id = :id AND version = :expectedVersion', {
        id: item.id,
        expectedVersion,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }
}
