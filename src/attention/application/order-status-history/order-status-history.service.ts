import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderStatusHistory } from '../../domain/entities/order-status-history.entity.js';
import { OrderStatus } from '../../domain/entities/order-status.enum.js';
import { OrderStatusHistoryNotFoundError } from '../../domain/exceptions/order-status-history.errors.js';
import { ORDER_STATUS_HISTORY_REPOSITORY } from '../../domain/repositories/order-status-history.repository.js';
import type { OrderStatusHistoryRepository } from '../../domain/repositories/order-status-history.repository.js';
import { OrdersService } from '../orders/orders.service.js';

export interface CreateOrderStatusHistoryInput {
  orderId: string;
  status: OrderStatus;
  notes?: string;
}

@Injectable()
export class OrderStatusHistoryService {
  constructor(
    @Inject(ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly orderStatusHistoryRepository: OrderStatusHistoryRepository,
    private readonly ordersService: OrdersService,
  ) {}

  async create(
    input: CreateOrderStatusHistoryInput,
  ): Promise<OrderStatusHistory> {
    await this.ordersService.findOne(input.orderId);

    const entry = OrderStatusHistory.create({ id: randomUUID(), ...input });
    const saved = await this.orderStatusHistoryRepository.save(entry);

    await this.ordersService.update(input.orderId, { status: input.status });

    return saved;
  }

  findAll(): Promise<OrderStatusHistory[]> {
    return this.orderStatusHistoryRepository.findAll();
  }

  async findOne(id: string): Promise<OrderStatusHistory> {
    const entry = await this.orderStatusHistoryRepository.findById(id);
    if (!entry) {
      throw new OrderStatusHistoryNotFoundError(id);
    }
    return entry;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.orderStatusHistoryRepository.delete(id);
    if (!deleted) {
      throw new OrderStatusHistoryNotFoundError(id);
    }
  }
}
