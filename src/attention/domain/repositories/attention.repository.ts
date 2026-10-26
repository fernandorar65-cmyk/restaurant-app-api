import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Attention } from '../entities/attention.entity.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export const ATTENTION_REPOSITORY = Symbol('ATTENTION_REPOSITORY');

export interface DailyAttentionCounts {
  opened: number;
  closed: number;
  cancelled: number;
}

export interface AttentionRepository {
  findById(id: string, tx?: TransactionContext): Promise<Attention | null>;
  /**
   * Reads the attention locking its row until the transaction ends, so state
   * changes (new orders, bill request, close, cancel) apply one after the other.
   */
  findByIdForUpdate(id: string, tx: TransactionContext): Promise<Attention | null>;
  /** Attentions opened / closed / cancelled on a business date (restaurant time zone). */
  countDaily(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<DailyAttentionCounts>;
  findActiveByDiningTable(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<Attention | null>;
  findPage(
    filter: {
    restaurantId?: string;
    status?: AttentionStatus;
  },
    page: PageRequest,
  ): Promise<Page<Attention>>;
  /**
   * Throws ActiveAttentionAlreadyExistsError if another active attention was
   * opened for the same table concurrently.
   */
  save(attention: Attention, tx?: TransactionContext): Promise<Attention>;
}
