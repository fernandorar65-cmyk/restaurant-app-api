import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { FulfillmentType } from '../../domain/entities/fulfillment-type.enum.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderStatus } from '../../domain/entities/order-status.enum.js';
import {
  InvalidTableQrTokenError,
  OrderAccessDeniedError,
} from '../../domain/exceptions/order.errors.js';
import { OrderItemsService } from '../order-items/order-items.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { TABLE_QR_LOOKUP } from '../ports/table-qr-lookup.port.js';
import type { TableQrLookupPort } from '../ports/table-qr-lookup.port.js';

export interface CustomerIdentity {
  customerId: string | null;
  guestToken: string | null;
}

export interface CreateCustomerOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface CreateCustomerOrderInput {
  restaurantId: string;
  fulfillmentType: FulfillmentType;
  tableToken?: string;
  deliveryAddress?: string;
  items: CreateCustomerOrderItemInput[];
}

export interface CustomerOrderBill {
  items: {
    id: string;
    name: string;
    quantity: number;
    subtotal: number;
    paidAmount: number;
    customerId: string | null;
  }[];
  subtotal: number;
  discountTotal: number;
  total: number;
  paid: number;
  balance: number;
}

@Injectable()
export class CustomerOrdersService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderItemsService: OrderItemsService,
    @Inject(TABLE_QR_LOOKUP) private readonly tableQrLookup: TableQrLookupPort,
  ) {}

  async createOrder(
    input: CreateCustomerOrderInput,
    customerId: string | null,
  ): Promise<{ order: Order; items: OrderItem[] }> {
    let diningTableId: string | undefined;

    if (input.fulfillmentType === FulfillmentType.DINE_IN) {
      if (!input.tableToken) {
        throw new ValidationDomainError('dine_in requiere tableToken');
      }
      const resolved = await this.tableQrLookup.resolveByToken(input.tableToken);
      if (!resolved || resolved.restaurantId !== input.restaurantId) {
        throw new InvalidTableQrTokenError();
      }
      diningTableId = resolved.tableId;

      const openOrder = await this.ordersService.findOpenByDiningTable(diningTableId);
      if (openOrder) {
        const items = await this.addItemsAsRound(openOrder, input.items, customerId);
        return { order: await this.ordersService.findOne(openOrder.id), items };
      }
    }

    const guestToken = customerId ? undefined : randomUUID();
    const order = await this.ordersService.create({
      fulfillmentType: input.fulfillmentType,
      diningTableId,
      deliveryAddress: input.deliveryAddress,
      customerId: customerId ?? undefined,
      guestToken,
    });

    const items = await this.addItemsAsRound(order, input.items, customerId);
    const refreshed = await this.ordersService.findOne(order.id);
    return { order: refreshed, items };
  }

  async addRound(
    orderId: string,
    items: CreateCustomerOrderItemInput[],
    identity: CustomerIdentity,
  ): Promise<{ order: Order; items: OrderItem[] }> {
    const order = await this.assertAccess(orderId, identity);
    await this.addItemsAsRound(order, items, identity.customerId);
    return this.getOrderWithItems(orderId, identity);
  }

  async getOrderWithItems(
    orderId: string,
    identity: CustomerIdentity,
  ): Promise<{ order: Order; items: OrderItem[] }> {
    const order = await this.assertAccess(orderId, identity);
    const orderItems = await this.orderItemsService.findByOrderId(orderId);
    return { order, items: orderItems };
  }

  async cancelItem(
    orderId: string,
    itemId: string,
    identity: CustomerIdentity,
  ): Promise<void> {
    const order = await this.assertAccess(orderId, identity);
    const item = await this.orderItemsService.findOne(itemId);
    if (item.orderId !== order.id) {
      throw new OrderAccessDeniedError();
    }
    if (order.status !== OrderStatus.OPEN) {
      throw new ValidationDomainError(
        'Solo se pueden cancelar platos mientras la cuenta sigue abierta',
      );
    }
    await this.orderItemsService.remove(itemId);
  }

  async getOrder(orderId: string, identity: CustomerIdentity): Promise<Order> {
    return this.assertAccess(orderId, identity);
  }

  async getBill(
    orderId: string,
    identity: CustomerIdentity,
  ): Promise<CustomerOrderBill> {
    await this.assertAccess(orderId, identity);
    const items = await this.orderItemsService.findByOrderId(orderId);
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        subtotal: item.quantity * item.unitPrice,
        paidAmount: 0,
        customerId: item.customerId,
      })),
      subtotal,
      discountTotal: 0,
      total: subtotal,
      paid: 0,
      balance: subtotal,
    };
  }

  async requestBill(orderId: string, identity: CustomerIdentity): Promise<Order> {
    await this.assertAccess(orderId, identity);
    return this.ordersService.requestBill(orderId);
  }

  private async addItemsAsRound(
    order: Order,
    items: CreateCustomerOrderItemInput[],
    customerId: string | null,
  ): Promise<OrderItem[]> {
    const roundNumber = await this.orderItemsService.nextRoundNumber(order.id);
    const created: OrderItem[] = [];
    for (const item of items) {
      created.push(
        await this.orderItemsService.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
          customerId: customerId ?? undefined,
          roundNumber,
        }),
      );
    }
    return created;
  }

  private async assertAccess(
    orderId: string,
    identity: CustomerIdentity,
  ): Promise<Order> {
    const order = await this.ordersService.findOne(orderId);
    const owned = order.isOwnedBy({
      customerId: identity.customerId ?? undefined,
      guestToken: identity.guestToken ?? undefined,
    });
    if (!owned) {
      throw new OrderAccessDeniedError();
    }
    return order;
  }
}
