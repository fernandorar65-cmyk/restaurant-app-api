import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderItemStatus } from '../../domain/enums/order-item-status.enum.js';
import { OrderSource } from '../../domain/enums/order-source.enum.js';
import {
  AttentionNotActiveError,
  AttentionNotFoundError,
  DuplicateOrderRequestError,
  OrderItemHasPaymentsError,
  OrderNotFoundError,
  ProductNotOrderableError,
  StaleOrderItemVersionError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { ORDER_ITEM_STATUS_HISTORY_REPOSITORY } from '../../domain/repositories/order-item-status-history.repository.js';
import type { OrderItemStatusHistoryRepository } from '../../domain/repositories/order-item-status-history.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type { ProductForOrder, ProductLookupPort } from '../ports/product-lookup.port.js';

export interface OrderLineInput {
  productId: string;
  quantity: number;
  customerNote?: string | null;
}

export interface SubmitOrderInput {
  attentionId: string;
  /** Client-generated id: resubmitting it returns the original order. */
  requestId: string;
  source: OrderSource;
  items: OrderLineInput[];
  submittedByUserId?: string | null;
  participantId?: string | null;
}

export interface OrderResult {
  order: Order;
  items: OrderItem[];
  /** False when the request id had already been processed. */
  created: boolean;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
    @Inject(ORDER_ITEM_STATUS_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderItemStatusHistoryRepository,
    @Inject(PRODUCT_LOOKUP) private readonly productLookup: ProductLookupPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    @Inject(PAYMENT_LEDGER) private readonly paymentLedger: PaymentLedgerPort,
  ) {}

  /**
   * Registers a order with server-side names and prices. Idempotent by
   * requestId: repeating it never duplicates products.
   */
  async submitOrder(input: SubmitOrderInput): Promise<OrderResult> {
    const previous = await this.findExisting(input.attentionId, input.requestId);
    if (previous) {
      return previous;
    }

    const attention = await this.attentionRepository.findById(input.attentionId);
    if (!attention) {
      throw new AttentionNotFoundError(input.attentionId);
    }
    const products = await this.validateItems(attention, input.items);

    try {
      return await this.transactionRunner.run((tx) =>
        this.placeOrder(input, products, tx),
      );
    } catch (error) {
      // A concurrent request with the same id won the race: return its order.
      if (error instanceof DuplicateOrderRequestError) {
        const winner = await this.findExisting(input.attentionId, input.requestId);
        if (winner) {
          return winner;
        }
      }
      throw error;
    }
  }

  /**
   * Records the order within the caller's transaction. The attention row is
   * locked first, so an attention closed or cancelled meanwhile rejects the
   * order instead of being re-opened, and a repeated requestId is detected.
   */
  async placeOrder(
    input: SubmitOrderInput,
    products: Map<string, ProductForOrder>,
    tx: TransactionContext,
  ): Promise<OrderResult> {
    const attention = await this.attentionRepository.findByIdForUpdate(
      input.attentionId,
      tx,
    );
    if (!attention) {
      throw new AttentionNotFoundError(input.attentionId);
    }
    const previous = await this.orderRepository.findByRequestId(
      attention.id,
      input.requestId,
      tx,
    );
    if (previous) {
      return {
        order: previous,
        items: await this.itemRepository.findByOrder(previous.id, tx),
        created: false,
      };
    }
    attention.acceptOrder();
    await this.attentionRepository.save(attention, tx);
    const order = await this.orderRepository.save(
      Order.submit({
        id: randomUUID(),
        attentionId: attention.id,
        requestId: input.requestId,
        source: input.source,
        submittedByUserId: input.submittedByUserId,
        submittedByParticipantId: input.participantId,
      }),
      tx,
    );
    const items: OrderItem[] = [];
    for (const line of input.items) {
      const product = products.get(line.productId) as ProductForOrder;
      const { item, history } = OrderItem.create({
        id: randomUUID(),
        historyId: randomUUID(),
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: line.quantity,
        customerNote: line.customerNote,
        requestedByParticipantId: input.participantId,
      });
      items.push(await this.itemRepository.insert(item, tx));
      await this.historyRepository.save(history, tx);
    }
    return { order, items, created: true };
  }

  async confirmOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    order.confirm();
    return this.orderRepository.save(order);
  }

  /**
   * Cancels a whole order (e.g. the table changed its mind) while nothing of
   * it has been served. Its pending items are cancelled with history; the
   * attention and its other orders are left untouched.
   */
  async cancelOrder(
    orderId: string,
    input: { reason: string; changedByUserId?: string | null },
  ): Promise<OrderResult> {
    await this.transactionRunner.run(async (tx) => {
      const order = await this.orderRepository.findByIdForUpdate(orderId, tx);
      if (!order) {
        throw new OrderNotFoundError(orderId);
      }
      const attention = await this.attentionRepository.findById(order.attentionId);
      if (attention && !attention.isActive) {
        throw new AttentionNotActiveError(attention.status);
      }
      const items = await this.itemRepository.findByOrder(orderId, tx);
      order.assertCancellable(items.map((item) => item.currentStatus));
      const pending = items.filter((line) => line.isBillable).map((line) => line.id);
      if ((await this.paymentLedger.itemsWithPayments(pending)).length > 0) {
        throw new OrderItemHasPaymentsError();
      }
      for (const item of items.filter((line) => line.isBillable)) {
        const expectedVersion = item.version;
        const entry = item.changeStatus(OrderItemStatus.CANCELLED, {
          historyId: randomUUID(),
          reason: input.reason,
          changedByUserId: input.changedByUserId,
        });
        if (!(await this.itemRepository.updateStatus(item, expectedVersion, tx))) {
          throw new StaleOrderItemVersionError(item.id);
        }
        await this.historyRepository.save(entry, tx);
      }
      order.syncWithItems(items.map((item) => item.currentStatus));
      await this.orderRepository.save(order, tx);
    });
    const order = await this.findOrder(orderId);
    return { order, items: await this.itemRepository.findByOrder(orderId), created: false };
  }

  /**
   * Locks the order row for the rest of the transaction. Every change of an
   * item takes this lock first (before touching the item), so item changes
   * and order cancellations always lock in the same order and never deadlock.
   */
  async lock(orderId: string, tx: TransactionContext): Promise<void> {
    if (!(await this.orderRepository.findByIdForUpdate(orderId, tx))) {
      throw new OrderNotFoundError(orderId);
    }
  }

  /**
   * Recomputes the order status after one of its items changed. Must run in
   * the same transaction as the item change; the order row is locked so
   * concurrent changes of sibling items can't compute it from stale data.
   */
  async syncStatus(orderId: string, tx: TransactionContext): Promise<void> {
    const order = await this.orderRepository.findByIdForUpdate(orderId, tx);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    const items = await this.itemRepository.findByOrder(orderId, tx);
    order.syncWithItems(items.map((item) => item.currentStatus));
    await this.orderRepository.save(order, tx);
  }

  findOrders(attentionId: string): Promise<Order[]> {
    return this.orderRepository.findByAttention(attentionId);
  }

  async findOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  private async findExisting(
    attentionId: string,
    requestId: string,
  ): Promise<OrderResult | null> {
    const order = await this.orderRepository.findByRequestId(attentionId, requestId);
    if (!order) {
      return null;
    }
    const items = await this.itemRepository.findByOrder(order.id);
    return { order, items, created: false };
  }

  /**
   * Validates every line against the current catalog of the restaurant,
   * before anything is saved.
   */
  async validateItems(
    attention: Pick<Attention, 'restaurantId' | 'serviceType'>,
    items: OrderLineInput[],
  ): Promise<Map<string, ProductForOrder>> {
    const products = await this.productLookup.findForOrder(
      [...new Set(items.map((item) => item.productId))],
      attention.serviceType,
    );
    const byId = new Map(products.map((product) => [product.id, product]));
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) {
        throw new ProductNotOrderableError(item.productId, 'PRODUCT_NOT_FOUND');
      }
      if (product.restaurantId !== attention.restaurantId) {
        throw new ProductNotOrderableError(item.productId, 'PRODUCT_NOT_IN_RESTAURANT');
      }
      if (product.issue) {
        throw new ProductNotOrderableError(item.productId, product.issue);
      }
    }
    return byId;
  }
}
