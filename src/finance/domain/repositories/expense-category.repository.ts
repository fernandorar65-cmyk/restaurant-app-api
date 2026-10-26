import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { ExpenseCategory } from '../entities/expense-category.entity.js';

export const EXPENSE_CATEGORY_REPOSITORY = Symbol('EXPENSE_CATEGORY_REPOSITORY');

export interface ExpenseCategoryRepository {
  findById(id: string): Promise<ExpenseCategory | null>;
  findByName(organizationId: string, name: string): Promise<ExpenseCategory | null>;
  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<ExpenseCategory>>;
  save(category: ExpenseCategory): Promise<ExpenseCategory>;
}
