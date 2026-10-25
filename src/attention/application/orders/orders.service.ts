import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Order } from '../../domain/entities/order.entity.js';
import type { OrderLineSnapshot } from '../../domain/entities/order.entity.js';
import { FulfillmentType } from '../../domain/entities/fulfillment-type.enum.js';
import { OrderStatus } from '../../domain/entities/order-status.enum.js';
import { DiningTableReferenceNotFoundError } from '../../domain/exceptions/external-reference.errors.js';
import { OrderNotFoundError } from '../../domain/exceptions/order.errors.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import type { TransactionContext } from '../../domain/transaction-context.js';
import { DINING_TABLE_LOOKUP } from '../ports/dining-table-lookup.port.js';
import type { DiningTableLookupPort } from '../ports/dining-table-lookup.port.js';

export interface CreateOrderInput {
  fulfillmentType?: FulfillmentType;
  diningTableId?: string;
  deliveryAddress?: string;
  customerId?: string;
  guestToken?: string;
  status?: OrderStatus;
}

export interface UpdateOrderInput {
  diningTableId?: string;
  status?: OrderStatus;
}

const OPEN_ORDER_STATUSES = [
  OrderStatus.OPEN,
  OrderStatus.IN_PROGRESS,
  OrderStatus.SERVED,
];

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(DINING_TABLE_LOOKUP)
    private readonly diningTableLookup: DiningTableLookupPort,
  ) {}

  async create(input: CreateOrderInput): Promise<Order> {
    const fulfillmentType = input.fulfillmentType ?? FulfillmentType.DINE_IN;
    if (fulfillmentType === FulfillmentType.DINE_IN && input.diningTableId) {
      await this.assertDiningTableExists(input.diningTableId);
    }
    const order = Order.create({ id: randomUUID(), ...input, fulfillmentType });
    return this.orderRepository.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  findOpenByDiningTable(diningTableId: string): Promise<Order | null> {
    return this.orderRepository.findOpenByDiningTableId(
      diningTableId,
      OPEN_ORDER_STATUSES,
    );
  }

  async findOne(id: string, tx?: TransactionContext): Promise<Order> {
    const order = await this.orderRepository.findById(id, tx);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  async update(
    id: string,
    input: UpdateOrderInput,
    tx?: TransactionContext,
  ): Promise<Order> {
    const order = await this.findOne(id, tx);
    if (input.diningTableId) {
      await this.assertDiningTableExists(input.diningTableId);
      order.changeDiningTable(input.diningTableId);
    }
    if (input.status) {
      order.changeStatus(input.status);
    }
    return this.orderRepository.save(order, tx);
  }

  async recalculateTotal(
    id: string,
    lines: OrderLineSnapshot[],
    tx?: TransactionContext,
  ): Promise<Order> {
    const order = await this.findOne(id, tx);
    order.recalculateTotal(lines);
    return this.orderRepository.save(order, tx);
  }

  async requestBill(id: string): Promise<Order> {
    const order = await this.findOne(id);
    order.requestBill();
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
