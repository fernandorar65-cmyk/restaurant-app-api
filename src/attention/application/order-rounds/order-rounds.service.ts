import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { OrderBatch } from '../../domain/entities/order-batch.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderBatchSource } from '../../domain/enums/order-batch-source.enum.js';
import {
  AttentionNotFoundError,
  DuplicateRoundRequestError,
  OrderBatchNotFoundError,
  ProductNotOrderableError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { ORDER_BATCH_REPOSITORY } from '../../domain/repositories/order-batch.repository.js';
import type { OrderBatchRepository } from '../../domain/repositories/order-batch.repository.js';
import { ORDER_ITEM_STATUS_HISTORY_REPOSITORY } from '../../domain/repositories/order-item-status-history.repository.js';
import type { OrderItemStatusHistoryRepository } from '../../domain/repositories/order-item-status-history.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { PRODUCT_LOOKUP } from '../ports/product-lookup.port.js';
import type { ProductForOrder, ProductLookupPort } from '../ports/product-lookup.port.js';

export interface RoundItemInput {
  productId: string;
  quantity: number;
  customerNote?: string | null;
}

export interface SubmitRoundInput {
  attentionId: string;
  /** Client-generated id: resubmitting it returns the original round. */
  requestId: string;
  source: OrderBatchSource;
  items: RoundItemInput[];
  submittedByUserId?: string | null;
  participantId?: string | null;
}

export interface RoundResult {
  batch: OrderBatch;
  items: OrderItem[];
  /** False when the request id had already been processed. */
  created: boolean;
}

@Injectable()
export class OrderRoundsService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ORDER_BATCH_REPOSITORY)
    private readonly batchRepository: OrderBatchRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
    @Inject(ORDER_ITEM_STATUS_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderItemStatusHistoryRepository,
    @Inject(PRODUCT_LOOKUP) private readonly productLookup: ProductLookupPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Registers a round with server-side names and prices. Idempotent by
   * requestId: repeating it never duplicates products.
   */
  async submitRound(input: SubmitRoundInput): Promise<RoundResult> {
    const previous = await this.findExisting(input.attentionId, input.requestId);
    if (previous) {
      return previous;
    }

    const attention = await this.attentionRepository.findById(input.attentionId);
    if (!attention) {
      throw new AttentionNotFoundError(input.attentionId);
    }
    attention.acceptRound();
    const products = await this.productsFor(attention, input.items);

    try {
      return await this.transactionRunner.run(async (tx) => {
        await this.attentionRepository.save(attention, tx);
        const batch = await this.batchRepository.save(
          OrderBatch.submit({
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
            batchId: batch.id,
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
        return { batch, items, created: true };
      });
    } catch (error) {
      // A concurrent request with the same id won the race: return its round.
      if (error instanceof DuplicateRoundRequestError) {
        const winner = await this.findExisting(input.attentionId, input.requestId);
        if (winner) {
          return winner;
        }
      }
      throw error;
    }
  }

  async confirmBatch(batchId: string): Promise<OrderBatch> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new OrderBatchNotFoundError(batchId);
    }
    batch.confirm();
    return this.batchRepository.save(batch);
  }

  findBatches(attentionId: string): Promise<OrderBatch[]> {
    return this.batchRepository.findByAttention(attentionId);
  }

  async findBatch(batchId: string): Promise<OrderBatch> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new OrderBatchNotFoundError(batchId);
    }
    return batch;
  }

  private async findExisting(
    attentionId: string,
    requestId: string,
  ): Promise<RoundResult | null> {
    const batch = await this.batchRepository.findByRequestId(attentionId, requestId);
    if (!batch) {
      return null;
    }
    const items = await this.itemRepository.findByBatch(batch.id);
    return { batch, items, created: false };
  }

  /** Validates every line against the current catalog of the restaurant. */
  private async productsFor(
    attention: Attention,
    items: RoundItemInput[],
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
