import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { ProductReferenceNotFoundError } from '../../domain/exceptions/external-reference.errors.js';
import { OrderItemNotFoundError } from '../../domain/exceptions/order-item.errors.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type { ProductLookupPort } from '../ports/product-lookup.port.js';
import { OrdersService } from '../orders/orders.service.js';

export interface CreateOrderItemInput {
  orderId: string;
  productId: string;
  quantity: number;
  userId?: string;
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
    private readonly ordersService: OrdersService,
  ) {}

  async create(input: CreateOrderItemInput): Promise<OrderItem> {
    await this.ordersService.findOne(input.orderId);

    const product = await this.productLookup.findById(input.productId);
    if (!product) {
      throw new ProductReferenceNotFoundError(input.productId);
    }

    const orderItem = OrderItem.create({
      id: randomUUID(),
      ...input,
      unitPrice: product.price,
    });
    return this.orderItemRepository.save(orderItem);
  }

  findAll(): Promise<OrderItem[]> {
    return this.orderItemRepository.findAll();
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
    orderItem.update(input);
    return this.orderItemRepository.save(orderItem);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.orderItemRepository.delete(id);
    if (!deleted) {
      throw new OrderItemNotFoundError(id);
    }
  }
}
