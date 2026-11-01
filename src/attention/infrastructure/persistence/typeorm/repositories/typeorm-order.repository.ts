import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { transactionalRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
import { Order } from '../../../../domain/entities/order.entity.js';
import {
  DuplicateOrderRequestError,
  StaleOrderItemVersionError,
} from '../../../../domain/exceptions/attention.errors.js';
import { OrderRepository } from '../../../../domain/repositories/order.repository.js';
import { OrderItemStatusHistoryOrmEntity } from '../entities/order-item-status-history.orm-entity.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';
import {
  OrderItemMapper,
  OrderItemStatusHistoryMapper,
  OrderMapper,
} from '../mappers/attention.mappers.js';

/** Loads and saves an order together with its items and their history. */
@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orders: Repository<OrderOrmEntity>,
    @InjectRepository(OrderItemOrmEntity)
    private readonly items: Repository<OrderItemOrmEntity>,
    @InjectRepository(OrderItemStatusHistoryOrmEntity)
    private readonly history: Repository<OrderItemStatusHistoryOrmEntity>,
  ) {}

  async findById(id: string, tx?: TransactionContext): Promise<Order | null> {
    const [order] = await this.load({ id }, tx);
    return order ?? null;
  }

  /**
   * Locks the order row until the transaction ends and then reads the whole
   * aggregate. The lock is taken without joins: Postgres can't lock the
   * nullable side of the outer joins TypeORM uses for relations.
   */
  async findByIdForUpdate(
    id: string,
    tx: TransactionContext,
  ): Promise<Order | null> {
    const locked = await transactionalRepository(this.orders, tx)
      .createQueryBuilder('row')
      .select('row.id')
      .where('row.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
    return locked ? this.findById(id, tx) : null;
  }

  async findByRequestId(
    attentionId: string,
    requestId: string,
    tx?: TransactionContext,
  ): Promise<Order | null> {
    const [order] = await this.load({ attentionId, requestId }, tx);
    return order ?? null;
  }

  findByAttention(attentionId: string): Promise<Order[]> {
    return this.load({ attentionId });
  }

  /**
   * Saves the order row, inserts its new items and updates the changed ones
   * only if nobody changed them since they were read (their version), plus
   * the history entries; then reads the aggregate back with fresh versions.
   */
  async save(order: Order, tx?: TransactionContext): Promise<Order> {
    const changes = order.pullChanges();
    const orders = transactionalRepository(this.orders, tx);
    const existing = await orders.findOne({ where: { id: order.id } });
    try {
      await orders.save(
        OrderMapper.toPersistence(order, existing ?? undefined),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'uq_orders_attention_request'
      ) {
        throw new DuplicateOrderRequestError(order.requestId);
      }
      throw error;
    }
    const items = transactionalRepository(this.items, tx);
    if (changes.newItems.length > 0) {
      await items.save(
        changes.newItems.map((item) => OrderItemMapper.toPersistence(item)),
      );
    }
    for (const item of changes.changedItems) {
      // TypeORM bumps the @VersionColumn and updated_at on query-builder updates.
      const result = await items
        .createQueryBuilder()
        .update(OrderItemOrmEntity)
        .set({
          orderStatusId: item.statusId,
          rejectionReason: item.rejectionReason,
        })
        .where('id = :id AND version = :version', {
          id: item.id,
          version: item.version,
        })
        .execute();
      if ((result.affected ?? 0) === 0) {
        throw new StaleOrderItemVersionError(item.id);
      }
    }
    if (changes.history.length > 0) {
      await transactionalRepository(this.history, tx).save(
        changes.history.map((entry) =>
          OrderItemStatusHistoryMapper.toPersistence(entry),
        ),
      );
    }
    return (await this.findById(order.id, tx)) as Order;
  }

  private async load(
    where: FindOptionsWhere<OrderOrmEntity>,
    tx?: TransactionContext,
  ): Promise<Order[]> {
    const rows = await transactionalRepository(this.orders, tx).find({
      where,
      relations: { status: true },
      order: { submittedAt: 'ASC' },
    });
    if (rows.length === 0) {
      return [];
    }
    const itemRows = await transactionalRepository(this.items, tx).find({
      where: { orderId: In(rows.map((row) => row.id)) },
      relations: { status: true },
      order: { createdAt: 'ASC' },
    });
    return rows.map((row) =>
      OrderMapper.toDomain(
        row,
        itemRows
          .filter((item) => item.orderId === row.id)
          .map((item) => OrderItemMapper.toDomain(item)),
      ),
    );
  }
}
