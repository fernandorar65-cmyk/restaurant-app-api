import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Attention } from '../entities/attention.entity.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';

export const ATTENTION_REPOSITORY = Symbol('ATTENTION_REPOSITORY');

export interface AttentionRepository {
  findById(id: string, tx?: TransactionContext): Promise<Attention | null>;
  findActiveByDiningTable(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<Attention | null>;
  findAll(filter?: {
    restaurantId?: string;
    status?: AttentionStatus;
  }): Promise<Attention[]>;
  /**
   * Throws ActiveAttentionAlreadyExistsError if another active attention was
   * opened for the same table concurrently.
   */
  save(attention: Attention, tx?: TransactionContext): Promise<Attention>;
}
