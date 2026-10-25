import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';
import { OrderRepository } from '../../../../domain/repositories/order.repository.js';
import type { TransactionContext } from '../../../../domain/transaction-context.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';
import { OrderMapper } from '../mappers/order.mapper.js';
import { TypeOrmTransactionContext } from '../typeorm-transaction-runner.js';

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

  protected toPersistence(domain: Order, existing?: OrderOrmEntity): OrderOrmEntity {
    return OrderMapper.toPersistence(domain, existing);
  }

  protected override getRepository(
    tx?: TransactionContext,
  ): Repository<OrderOrmEntity> {
    if (tx instanceof TypeOrmTransactionContext) {
      return tx.manager.getRepository(OrderOrmEntity);
    }
    return this.repository;
  }

  async findOpenByDiningTableId(
    diningTableId: string,
    openStatuses: OrderStatus[],
  ): Promise<Order | null> {
    const found = await this.repository.findOne({
      where: { diningTableId, status: In(openStatuses) },
      order: { createdAt: 'DESC' },
    });
    return found ? this.toDomain(found) : null;
  }
}
