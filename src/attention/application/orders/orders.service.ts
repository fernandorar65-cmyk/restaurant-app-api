import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderStatus } from '../../domain/entities/order-status.enum.js';
import { DiningTableReferenceNotFoundError } from '../../domain/exceptions/external-reference.errors.js';
import { OrderNotFoundError } from '../../domain/exceptions/order.errors.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { DINING_TABLE_LOOKUP } from '../ports/dining-table-lookup.port.js';
import type { DiningTableLookupPort } from '../ports/dining-table-lookup.port.js';

export interface CreateOrderInput {
  diningTableId: string;
  status?: OrderStatus;
}

export interface UpdateOrderInput {
  diningTableId?: string;
  status?: OrderStatus;
  total?: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(DINING_TABLE_LOOKUP)
    private readonly diningTableLookup: DiningTableLookupPort,
  ) {}

  async create(input: CreateOrderInput): Promise<Order> {
    await this.assertDiningTableExists(input.diningTableId);
    const order = Order.create({ id: randomUUID(), ...input });
    return this.orderRepository.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  async update(id: string, input: UpdateOrderInput): Promise<Order> {
    const order = await this.findOne(id);
    if (input.diningTableId) {
      await this.assertDiningTableExists(input.diningTableId);
    }
    order.update(input);
    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.orderRepository.delete(id);
    if (!deleted) {
      throw new OrderNotFoundError(id);
    }
  }

  private async assertDiningTableExists(diningTableId: string): Promise<void> {
    const exists = await this.diningTableLookup.exists(diningTableId);
    if (!exists) {
      throw new DiningTableReferenceNotFoundError(diningTableId);
    }
  }
}
