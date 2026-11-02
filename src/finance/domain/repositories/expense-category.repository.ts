import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import { ExpenseCategory } from '../entities/expense-category.entity.js';

export const EXPENSE_CATEGORY_REPOSITORY = Symbol('EXPENSE_CATEGORY_REPOSITORY');

export interface ExpenseCategoryRepository {
  findById(id: string): Promise<ExpenseCategory | null>;
  findByName(organizationId: string, name: string): Promise<ExpenseCategory | null>;
  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<ExpenseCategory>>;
  save(category: ExpenseCategory, tx?: TransactionContext): Promise<ExpenseCategory>;
}
