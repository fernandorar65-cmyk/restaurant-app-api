import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import { Expense } from '../entities/expense.entity.js';
import { ExpenseStatus } from '../enums/expense-status.enum.js';

export const EXPENSE_REPOSITORY = Symbol('EXPENSE_REPOSITORY');

export interface ExpenseFilter {
  restaurantId?: string;
  categoryId?: string;
  status?: ExpenseStatus;
  /** Inclusive business-date range 'YYYY-MM-DD'. */
  from?: string;
  to?: string;
}

export interface DailyExpenseTotals {
  total: number;
  cash: number;
}

export interface DatedExpenseTotals extends DailyExpenseTotals {
  businessDate: string;
}

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findPage(filter: ExpenseFilter, page: PageRequest): Promise<Page<Expense>>;
  /** REGISTERED (not voided) expenses of a business date. */
  dailyTotals(restaurantId: string, businessDate: string): Promise<DailyExpenseTotals>;
  /** The same per business date of an inclusive range (only dates with expenses). */
  totalsByDate(
    restaurantId: string,
    from: string,
    to: string,
  ): Promise<DatedExpenseTotals[]>;
  save(expense: Expense): Promise<Expense>;
  /** Moves every expense of a category (voided ones too) to another; returns how many. */
  reassignCategory(
    fromCategoryId: string,
    toCategoryId: string,
    tx: TransactionContext,
  ): Promise<number>;
}
