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
import { Money } from '../../../../../common/domain/value-objects/money.js';
import type {
  ItemReportFilter,
  ProductSales,
  StageDuration,
} from '../../../../domain/repositories/order-item.repository.js';
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

  async productSales(
    filter: ItemReportFilter,
    limit: number,
  ): Promise<ProductSales[]> {
    const rows = await this.repository.query<
      {
        product_id: string;
        product_name: string;
        quantity: string;
        revenue: string;
      }[]
    >(
      `SELECT item.product_id,
              (array_agg(item.product_name_snapshot ORDER BY item.created_at DESC))[1] AS product_name,
              SUM(item.quantity) AS quantity,
              SUM(item.subtotal) AS revenue
         FROM order_items item
         JOIN orders o ON o.id = item.order_id
         JOIN attentions a ON a.id = o.attention_id
         JOIN order_statuses status ON status.id = item.order_status_id
        WHERE a.restaurant_id = $1
          AND a.cancelled_at IS NULL
          AND status.canonical_state NOT IN ($5, $6)
          AND (o.submitted_at AT TIME ZONE $2)::date BETWEEN $3 AND $4
        GROUP BY item.product_id
        ORDER BY SUM(item.quantity) DESC, SUM(item.subtotal) DESC
        LIMIT $7`,
      [
        filter.restaurantId,
        filter.timeZone,
        filter.from,
        filter.to,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
        limit,
      ],
    );
    return rows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      quantity: Number(row.quantity),
      revenue: Money.parse(row.revenue).amount,
    }));
  }

  async stageDurations(filter: ItemReportFilter): Promise<StageDuration[]> {
    const stages: [OrderStatus, OrderStatus][] = [
      [OrderStatus.SUBMITTED, OrderStatus.IN_PREPARATION],
      [OrderStatus.IN_PREPARATION, OrderStatus.READY],
      [OrderStatus.READY, OrderStatus.SERVED],
      [OrderStatus.SUBMITTED, OrderStatus.SERVED],
    ];
    // First moment each item reached each canonical state (enum values, not user input).
    const reachedColumns = Object.values(OrderStatus).map(
      (state) =>
        `MIN(history.changed_at) FILTER (WHERE status.canonical_state = '${state}') AS "${state}"`,
    );
    const stageColumns = stages.map(
      ([from, to], index) =>
        `AVG(EXTRACT(EPOCH FROM ("${to}" - "${from}")) / 60) AS avg_${index}, ` +
        `COUNT("${to}" - "${from}") AS items_${index}`,
    );
    const [row] = await this.repository.query<Record<string, string | null>[]>(
      `WITH reached AS (
         SELECT history.order_item_id, ${reachedColumns.join(', ')}
           FROM order_item_status_history history
           JOIN order_statuses status ON status.id = history.new_status_id
           JOIN order_items item ON item.id = history.order_item_id
           JOIN orders o ON o.id = item.order_id
           JOIN attentions a ON a.id = o.attention_id
          WHERE a.restaurant_id = $1
            AND (o.submitted_at AT TIME ZONE $2)::date BETWEEN $3 AND $4
          GROUP BY history.order_item_id
       )
       SELECT ${stageColumns.join(', ')} FROM reached`,
      [filter.restaurantId, filter.timeZone, filter.from, filter.to],
    );
    return stages.map(([from, to], index) => ({
      from,
      to,
      averageMinutes: Math.round(Number(row?.[`avg_${index}`] ?? 0) * 10) / 10,
      items: Number(row?.[`items_${index}`] ?? 0),
    }));
  }
}
