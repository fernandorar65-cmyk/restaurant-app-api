import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Fulfillment } from '../entities/fulfillment.entity.js';

export const FULFILLMENT_REPOSITORY = Symbol('FULFILLMENT_REPOSITORY');

export interface FulfillmentRepository {
  findByAttention(attentionId: string): Promise<Fulfillment | null>;
  save(fulfillment: Fulfillment, tx?: TransactionContext): Promise<Fulfillment>;
}
