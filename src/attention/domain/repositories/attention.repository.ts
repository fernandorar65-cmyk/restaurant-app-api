import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Attention } from '../entities/attention.entity.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';

export const ATTENTION_REPOSITORY = Symbol('ATTENTION_REPOSITORY');

export interface DailyAttentionCounts {
  opened: number;
  closed: number;
  cancelled: number;
}

export interface DatedAttentionCounts extends DailyAttentionCounts {
  businessDate: string;
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
  /** Active (OPEN / BILL_REQUESTED) attentions of the restaurant, oldest first. */
  findActiveByRestaurant(restaurantId: string): Promise<Attention[]>;
  /** Same counts per business date of an inclusive range (only dates with activity). */
  countByDate(
    restaurantId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<DatedAttentionCounts[]>;
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
   * Attentions the user took part in (as its customer or as a participant),
   * most recent first.
   */
  findPageByUser(userId: string, page: PageRequest): Promise<Page<Attention>>;
  /**
   * Throws ActiveAttentionAlreadyExistsError if another active attention was
   * opened for the same table concurrently.
   */
  save(attention: Attention, tx?: TransactionContext): Promise<Attention>;
}
