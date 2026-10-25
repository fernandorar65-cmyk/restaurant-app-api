import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderItemRepository } from '../../../../domain/repositories/order-item.repository.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';
import { OrderItemMapper } from '../mappers/order-item.mapper.js';

@Injectable()
export class TypeOrmOrderItemRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemOrmEntity)
    private readonly repository: Repository<OrderItemOrmEntity>,
  ) {}

  async findById(id: string): Promise<OrderItem | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? OrderItemMapper.toDomain(found) : null;
  }

  async findAll(): Promise<OrderItem[]> {
    const rows = await this.repository.find();
    return rows.map(OrderItemMapper.toDomain);
  }

  async save(orderItem: OrderItem): Promise<OrderItem> {
    const existing = await this.repository.findOne({
      where: { id: orderItem.id },
    });
    const orm = OrderItemMapper.toPersistence(orderItem, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return OrderItemMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
