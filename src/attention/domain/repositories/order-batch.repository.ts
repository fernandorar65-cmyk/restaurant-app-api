import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { OrderBatch } from '../entities/order-batch.entity.js';

export const ORDER_BATCH_REPOSITORY = Symbol('ORDER_BATCH_REPOSITORY');

export interface OrderBatchRepository {
  findById(id: string): Promise<OrderBatch | null>;
  findByRequestId(
    attentionId: string,
    requestId: string,
    tx?: TransactionContext,
  ): Promise<OrderBatch | null>;
  findByAttention(attentionId: string): Promise<OrderBatch[]>;
  save(batch: OrderBatch, tx?: TransactionContext): Promise<OrderBatch>;
}
