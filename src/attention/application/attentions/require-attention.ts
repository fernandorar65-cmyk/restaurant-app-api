import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import type { Attention } from '../../domain/entities/attention.entity.js';
import { AttentionNotFoundError } from '../../domain/exceptions/attention.errors.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';

export async function requireAttention(
  repository: AttentionRepository,
  id: string,
  tx?: TransactionContext,
): Promise<Attention> {
  const attention = await repository.findById(id, tx);
  if (!attention) {
    throw new AttentionNotFoundError(id);
  }
  return attention;
}

/** Reads the attention locking its row until the transaction ends. */
export async function lockAttention(
  repository: AttentionRepository,
  id: string,
  tx: TransactionContext,
): Promise<Attention> {
  const attention = await repository.findByIdForUpdate(id, tx);
  if (!attention) {
    throw new AttentionNotFoundError(id);
  }
  return attention;
}
