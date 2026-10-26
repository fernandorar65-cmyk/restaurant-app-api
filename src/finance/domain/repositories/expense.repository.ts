import type { Page, PageRequest } from '../../../common/application/pagination.js';
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

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findPage(filter: ExpenseFilter, page: PageRequest): Promise<Page<Expense>>;
  /** REGISTERED (not voided) expenses of a business date. */
  dailyTotals(restaurantId: string, businessDate: string): Promise<DailyExpenseTotals>;
  save(expense: Expense): Promise<Expense>;
}
