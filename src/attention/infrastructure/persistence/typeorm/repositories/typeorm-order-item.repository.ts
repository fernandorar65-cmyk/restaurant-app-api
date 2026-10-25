import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderItemRepository } from '../../../../domain/repositories/order-item.repository.js';
import type { TransactionContext } from '../../../../domain/transaction-context.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';
import { OrderItemMapper } from '../mappers/order-item.mapper.js';
import { TypeOrmTransactionContext } from '../typeorm-transaction-runner.js';

@Injectable()
export class TypeOrmOrderItemRepository
  extends TypeOrmBaseRepository<OrderItem, OrderItemOrmEntity>
  implements OrderItemRepository
{
  constructor(
    @InjectRepository(OrderItemOrmEntity)
    repository: Repository<OrderItemOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: OrderItemOrmEntity): OrderItem {
    return OrderItemMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: OrderItem,
    existing?: OrderItemOrmEntity,
  ): OrderItemOrmEntity {
    return OrderItemMapper.toPersistence(domain, existing);
  }

  protected override getRepository(
    tx?: TransactionContext,
  ): Repository<OrderItemOrmEntity> {
    if (tx instanceof TypeOrmTransactionContext) {
      return tx.manager.getRepository(OrderItemOrmEntity);
    }
    return this.repository;
  }

  async findByOrderId(
    orderId: string,
    tx?: TransactionContext,
  ): Promise<OrderItem[]> {
    const rows = await this.getRepository(tx).find({ where: { orderId } });
    return rows.map((row) => this.toDomain(row));
  }
}
