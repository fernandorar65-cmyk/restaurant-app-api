import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import { OrderSource } from '../../domain/enums/order-source.enum.js';
import { DuplicateOrderRequestError } from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { requireOrderableProducts } from '../../domain/services/orderable-products.js';
import { WorkflowStatusesService } from '../attention-settings/workflow-statuses.service.js';
import {
  lockAttention,
  requireAttention,
} from '../attentions/require-attention.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type {
  ProductForOrder,
  ProductLookupPort,
} from '../ports/product-lookup.port.js';

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

/** Sending an order (comanda / ronda) to an attention, by staff or a diner. */
@Injectable()
export class OrderSubmissionService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(PRODUCT_LOOKUP) private readonly productLookup: ProductLookupPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly statuses: WorkflowStatusesService,
  ) {}

  /**
   * Registers a order with server-side names and prices. Idempotent by
   * requestId: repeating it never duplicates products.
   */
  async submitOrder(input: SubmitOrderInput): Promise<OrderResult> {
    const previous = await this.findExisting(
      input.attentionId,
      input.requestId,
    );
    if (previous) {
      return previous;
    }

    const attention = await requireAttention(
      this.attentionRepository,
      input.attentionId,
    );
    const products = await this.validateItems(attention, input.items);

    try {
      return await this.transactionRunner.run((tx) =>
        this.placeOrder(input, products, tx),
      );
    } catch (error) {
      // A concurrent request with the same id won the race: return its order.
      if (error instanceof DuplicateOrderRequestError) {
        const winner = await this.findExisting(
          input.attentionId,
          input.requestId,
        );
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
    const attention = await lockAttention(
      this.attentionRepository,
      input.attentionId,
      tx,
    );
    const previous = await this.orderRepository.findByRequestId(
      attention.id,
      input.requestId,
      tx,
    );
    if (previous) {
      return { order: previous, items: [...previous.items], created: false };
    }
    const attentionStatuses = await this.statuses.attentionCatalog(
      attention.restaurantId,
      tx,
    );
    const orderStatuses = await this.statuses.orderCatalog(
      attention.restaurantId,
      tx,
    );
    attention.acceptOrder(attentionStatuses.defaultFor(AttentionStatus.OPEN));
    await this.attentionRepository.save(attention, tx);
    const order = await this.orderRepository.save(
      Order.submit({
        id: randomUUID(),
        attentionId: attention.id,
        requestId: input.requestId,
        source: input.source,
        status: orderStatuses.initial(),
        submittedByUserId: input.submittedByUserId,
        submittedByParticipantId: input.participantId,
        lines: input.items.map((line) => {
          const product = products.get(line.productId) as ProductForOrder;
          return {
            itemId: randomUUID(),
            historyId: randomUUID(),
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity: line.quantity,
            customerNote: line.customerNote,
          };
        }),
      }),
      tx,
    );
    return { order, items: [...order.items], created: true };
  }

  /**
   * Validates every line against the current catalog of the restaurant,
   * before anything is saved.
   */
  async validateItems(
    attention: Pick<Attention, 'restaurantId' | 'fulfillmentMode'>,
    items: OrderLineInput[],
  ): Promise<Map<string, ProductForOrder>> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    return requireOrderableProducts(
      attention.restaurantId,
      productIds,
      await this.productLookup.findForOrder(
        productIds,
        attention.fulfillmentMode,
      ),
    );
  }

  private async findExisting(
    attentionId: string,
    requestId: string,
  ): Promise<OrderResult | null> {
    const order = await this.orderRepository.findByRequestId(
      attentionId,
      requestId,
    );
    if (!order) {
      return null;
    }
    return { order, items: [...order.items], created: false };
  }
}
