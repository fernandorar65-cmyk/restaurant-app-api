import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import type { Order } from '../../domain/entities/order.entity.js';
import { OrderNotFoundError } from '../../domain/exceptions/attention.errors.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { requireAttention } from '../attentions/require-attention.js';

export async function requireOrder(
  repository: OrderRepository,
  id: string,
): Promise<Order> {
  const order = await repository.findById(id);
  if (!order) {
    throw new OrderNotFoundError(id);
  }
  return order;
}

/** Reads the order locking its row until the transaction ends. */
export async function lockOrder(
  repository: OrderRepository,
  id: string,
  tx: TransactionContext,
): Promise<Order> {
  const order = await repository.findByIdForUpdate(id, tx);
  if (!order) {
    throw new OrderNotFoundError(id);
  }
  return order;
}

/** The restaurant an order belongs to (through its attention). */
export async function restaurantOfOrder(
  attentionRepository: AttentionRepository,
  order: Order,
  tx?: TransactionContext,
): Promise<string> {
  const attention = await requireAttention(
    attentionRepository,
    order.attentionId,
    tx,
  );
  return attention.restaurantId;
}
