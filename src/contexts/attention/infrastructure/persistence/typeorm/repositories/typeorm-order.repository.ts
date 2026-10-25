import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderRepository } from '../../../../domain/repositories/order.repository.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';
import { OrderMapper } from '../mappers/order.mapper.js';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repository: Repository<OrderOrmEntity>,
  ) {}

  async findById(id: string): Promise<Order | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? OrderMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Order[]> {
    const rows = await this.repository.find();
    return rows.map(OrderMapper.toDomain);
  }

  async save(order: Order): Promise<Order> {
    const existing = await this.repository.findOne({ where: { id: order.id } });
    const orm = OrderMapper.toPersistence(order, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return OrderMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
