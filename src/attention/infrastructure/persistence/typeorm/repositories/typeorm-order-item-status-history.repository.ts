import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderItemStatusHistory } from '../../../../domain/entities/order-item-status-history.entity.js';
import { OrderItemStatusHistoryRepository } from '../../../../domain/repositories/order-item-status-history.repository.js';
import { OrderItemStatusHistoryOrmEntity } from '../entities/order-item-status-history.orm-entity.js';
import { OrderItemStatusHistoryMapper } from '../mappers/attention.mappers.js';

@Injectable()
export class TypeOrmOrderItemStatusHistoryRepository implements OrderItemStatusHistoryRepository {
  constructor(
    @InjectRepository(OrderItemStatusHistoryOrmEntity)
    private readonly repository: Repository<OrderItemStatusHistoryOrmEntity>,
  ) {}

  async findByItem(orderItemId: string): Promise<OrderItemStatusHistory[]> {
    const rows = await this.repository.find({
      where: { orderItemId },
      relations: { previousStatus: true, newStatus: true },
      order: { changedAt: 'ASC' },
    });
    return rows.map((row) => OrderItemStatusHistoryMapper.toDomain(row));
  }

  async findByItems(orderItemIds: string[]): Promise<OrderItemStatusHistory[]> {
    if (orderItemIds.length === 0) {
      return [];
    }
    const rows = await this.repository.find({
      where: { orderItemId: In(orderItemIds) },
      relations: { previousStatus: true, newStatus: true },
      order: { changedAt: 'ASC' },
    });
    return rows.map((row) => OrderItemStatusHistoryMapper.toDomain(row));
  }
}
