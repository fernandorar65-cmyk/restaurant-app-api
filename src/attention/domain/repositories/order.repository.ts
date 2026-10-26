import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Order } from '../entities/order.entity.js';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  findById(id: string, tx?: TransactionContext): Promise<Order | null>;
  /**
   * Reads the order locking its row until the transaction ends, so status
   * updates of its items are applied one after the other.
   */
  findByIdForUpdate(id: string, tx: TransactionContext): Promise<Order | null>;
  findByRequestId(
    attentionId: string,
    requestId: string,
    tx?: TransactionContext,
  ): Promise<Order | null>;
  findByAttention(attentionId: string): Promise<Order[]>;
  save(order: Order, tx?: TransactionContext): Promise<Order>;
}
