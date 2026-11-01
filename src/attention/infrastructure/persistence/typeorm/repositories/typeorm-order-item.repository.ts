import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Page,
  PageRequest,
} from '../../../../../common/domain/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import { OrderItemRepository } from '../../../../domain/repositories/order-item.repository.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';
import { OrderItemMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmOrderItemRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemOrmEntity)
    private readonly repository: Repository<OrderItemOrmEntity>,
  ) {}

  async findById(
    id: string,
    tx?: TransactionContext,
  ): Promise<OrderItem | null> {
    const found = await transactionalRepository(this.repository, tx).findOne({
      where: { id },
      relations: { status: true },
    });
    return found ? OrderItemMapper.toDomain(found) : null;
  }

  async findByOrder(
    orderId: string,
    tx?: TransactionContext,
  ): Promise<OrderItem[]> {
    const rows = await transactionalRepository(this.repository, tx).find({
      where: { orderId },
      relations: { status: true },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) => OrderItemMapper.toDomain(row));
  }

  async findByAttention(attentionId: string): Promise<OrderItem[]> {
    const rows = await this.repository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.status', 'status')
      .innerJoin('item.order', 'ord')
      .where('ord.attention_id = :attentionId', { attentionId })
      .orderBy('item.created_at', 'ASC')
      .getMany();
    return rows.map((row) => OrderItemMapper.toDomain(row));
  }

  async findForBoard(
    filter: {
      restaurantId: string;
      statuses?: OrderStatus[];
      includeClosedAttentions?: boolean;
    },
    page: PageRequest,
  ): Promise<Page<OrderItem>> {
    const query = this.repository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.status', 'status')
      .innerJoin('item.order', 'ord')
      .innerJoin('ord.attention', 'attention')
      .where('attention.restaurant_id = :restaurantId', {
        restaurantId: filter.restaurantId,
      })
      .orderBy('item.created_at', 'ASC')
      .skip((page.page - 1) * page.limit)
      .take(page.limit);
    if (!filter.includeClosedAttentions) {
      query.andWhere(
        'attention.closed_at IS NULL AND attention.cancelled_at IS NULL',
      );
    }
    if (filter.statuses?.length) {
      query.andWhere('status.canonical_state IN (:...statuses)', {
        statuses: filter.statuses,
      });
    }
    const [rows, total] = await query.getManyAndCount();
    return {
      items: rows.map((row) => OrderItemMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }
}
