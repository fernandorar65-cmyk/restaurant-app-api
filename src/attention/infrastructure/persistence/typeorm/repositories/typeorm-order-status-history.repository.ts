import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatusHistory } from '../../../../domain/entities/order-status-history.entity.js';
import { OrderStatusHistoryRepository } from '../../../../domain/repositories/order-status-history.repository.js';
import { OrderStatusHistoryOrmEntity } from '../entities/order-status-history.orm-entity.js';
import { OrderStatusHistoryMapper } from '../mappers/order-status-history.mapper.js';

@Injectable()
export class TypeOrmOrderStatusHistoryRepository
  implements OrderStatusHistoryRepository
{
  constructor(
    @InjectRepository(OrderStatusHistoryOrmEntity)
    private readonly repository: Repository<OrderStatusHistoryOrmEntity>,
  ) {}

  async findById(id: string): Promise<OrderStatusHistory | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? OrderStatusHistoryMapper.toDomain(found) : null;
  }

  async findAll(): Promise<OrderStatusHistory[]> {
    const rows = await this.repository.find();
    return rows.map(OrderStatusHistoryMapper.toDomain);
  }

  async save(entry: OrderStatusHistory): Promise<OrderStatusHistory> {
    const existing = await this.repository.findOne({ where: { id: entry.id } });
    const orm = OrderStatusHistoryMapper.toPersistence(
      entry,
      existing ?? undefined,
    );
    const saved = await this.repository.save(orm);
    return OrderStatusHistoryMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
