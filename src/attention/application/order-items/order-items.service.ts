import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import {
  ProductReferenceNotFoundError,
  UserReferenceNotFoundError,
} from '../../domain/exceptions/external-reference.errors.js';
import {
  OrderItemNotFoundError,
  ProductUnavailableError,
} from '../../domain/exceptions/order-item.errors.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import type { TransactionContext } from '../../domain/transaction-context.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type { ProductLookupPort } from '../ports/product-lookup.port.js';
import { USER_LOOKUP } from '../ports/user-lookup.port.js';
import type { UserLookupPort } from '../ports/user-lookup.port.js';
import { OrdersService } from '../orders/orders.service.js';
import { TRANSACTION_RUNNER } from '../ports/transaction-runner.port.js';
import type { TransactionRunner } from '../ports/transaction-runner.port.js';

export interface CreateOrderItemInput {
  orderId: string;
  productId: string;
  quantity: number;
  userId?: string;
  customerId?: string;
  roundNumber?: number;
  notes?: string;
}

export interface UpdateOrderItemInput {
  quantity?: number;
  notes?: string;
}

@Injectable()
export class OrderItemsService {
  constructor(
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly orderItemRepository: OrderItemRepository,
    @Inject(PRODUCT_LOOKUP) private readonly productLookup: ProductLookupPort,
    @Inject(USER_LOOKUP) private readonly userLookup: UserLookupPort,
    private readonly ordersService: OrdersService,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async create(input: CreateOrderItemInput): Promise<OrderItem> {
    await this.ordersService.findOne(input.orderId);

    const product = await this.productLookup.findById(input.productId);
    if (!product) {
      throw new ProductReferenceNotFoundError(input.productId);
    }
    if (!product.available) {
      throw new ProductUnavailableError(input.productId);
    }

    if (input.userId) {
      const userExists = await this.userLookup.exists(input.userId);
      if (!userExists) {
        throw new UserReferenceNotFoundError(input.userId);
      }
    }

    return this.transactionRunner.run(async (tx) => {
      const orderItem = OrderItem.create({
        id: randomUUID(),
        ...input,
        unitPrice: product.price,
        productName: product.name,
      });
      const saved = await this.orderItemRepository.save(orderItem, tx);
      await this.recalculateOrderTotal(input.orderId, tx);
      return saved;
    });
  }

  findAll(): Promise<OrderItem[]> {
    return this.orderItemRepository.findAll();
  }

  findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.findByOrderId(orderId);
  }

  async nextRoundNumber(orderId: string): Promise<number> {
    const items = await this.orderItemRepository.findByOrderId(orderId);
    if (items.length === 0) {
      return 1;
    }
    return Math.max(...items.map((item) => item.roundNumber)) + 1;
  }

  async findOne(id: string): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findById(id);
    if (!orderItem) {
      throw new OrderItemNotFoundError(id);
    }
    return orderItem;
  }

  async update(id: string, input: UpdateOrderItemInput): Promise<OrderItem> {
    const orderItem = await this.findOne(id);
    return this.transactionRunner.run(async (tx) => {
      orderItem.update(input);
      const saved = await this.orderItemRepository.save(orderItem, tx);
      await this.recalculateOrderTotal(orderItem.orderId, tx);
      return saved;
    });
  }

  async remove(id: string): Promise<void> {
    const orderItem = await this.findOne(id);
    await this.transactionRunner.run(async (tx) => {
      const deleted = await this.orderItemRepository.delete(id, tx);
      if (!deleted) {
        throw new OrderItemNotFoundError(id);
      }
      await this.recalculateOrderTotal(orderItem.orderId, tx);
    });
  }

  private async recalculateOrderTotal(
    orderId: string,
    tx: TransactionContext,
  ): Promise<void> {
    const items = await this.orderItemRepository.findByOrderId(orderId, tx);
    await this.ordersService.recalculateTotal(
      orderId,
      items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      tx,
    );
  }
}
