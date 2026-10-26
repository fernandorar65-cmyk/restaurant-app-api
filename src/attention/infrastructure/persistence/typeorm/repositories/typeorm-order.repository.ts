import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Order } from '../../../../domain/entities/order.entity.js';
import { DuplicateOrderRequestError } from '../../../../domain/exceptions/attention.errors.js';
import { OrderRepository } from '../../../../domain/repositories/order.repository.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';
import { OrderMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmOrderRepository
  extends TypeOrmBaseRepository<Order, OrderOrmEntity>
  implements OrderRepository
{
  constructor(
    @InjectRepository(OrderOrmEntity)
    repository: Repository<OrderOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: OrderOrmEntity): Order {
    return OrderMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Order,
    existing?: OrderOrmEntity,
  ): OrderOrmEntity {
    return OrderMapper.toPersistence(domain, existing);
  }

  async findByRequestId(
    attentionId: string,
    requestId: string,
    tx?: TransactionContext,
  ): Promise<Order | null> {
    const found = await this.getRepository(tx).findOne({
      where: { attentionId, requestId },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByIdForUpdate(id: string, tx: TransactionContext): Promise<Order | null> {
    const found = await this.getRepository(tx).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByAttention(attentionId: string): Promise<Order[]> {
    const rows = await this.repository.find({
      where: { attentionId },
      order: { submittedAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  override async save(order: Order, tx?: TransactionContext): Promise<Order> {
    try {
      return await super.save(order, tx);
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
  }
}
