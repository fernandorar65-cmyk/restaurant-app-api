import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { DailyClosure } from '../entities/daily-closure.entity.js';

export const DAILY_CLOSURE_REPOSITORY = Symbol('DAILY_CLOSURE_REPOSITORY');

export interface DailyClosureRepository {
  findById(id: string): Promise<DailyClosure | null>;
  findByDate(restaurantId: string, businessDate: string): Promise<DailyClosure | null>;
  findPage(
    filter: { restaurantId?: string; from?: string; to?: string },
    page: PageRequest,
  ): Promise<Page<DailyClosure>>;
  /** Persists the closure together with its per-method totals. */
  insert(closure: DailyClosure): Promise<DailyClosure>;
}
