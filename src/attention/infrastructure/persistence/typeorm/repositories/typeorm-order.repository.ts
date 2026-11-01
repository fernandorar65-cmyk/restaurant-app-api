import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { FindOptionsRelations } from 'typeorm';
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
  protected override readonly relations: FindOptionsRelations<OrderOrmEntity> =
    {
      status: true,
    };

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
      relations: this.relations,
    });
    return found ? this.toDomain(found) : null;
  }

  async findByIdForUpdate(
    id: string,
    tx: TransactionContext,
  ): Promise<Order | null> {
    return this.findByIdLocked(id, tx);
  }

  async findByAttention(attentionId: string): Promise<Order[]> {
    const rows = await this.repository.find({
      where: { attentionId },
      relations: this.relations,
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
