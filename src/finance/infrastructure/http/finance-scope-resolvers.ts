import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { DAILY_CLOSURE_REPOSITORY } from '../../domain/repositories/daily-closure.repository.js';
import type { DailyClosureRepository } from '../../domain/repositories/daily-closure.repository.js';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../domain/repositories/expense-category.repository.js';
import type { ExpenseCategoryRepository } from '../../domain/repositories/expense-category.repository.js';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.js';
import type { ExpenseRepository } from '../../domain/repositories/expense.repository.js';

/** Tells the authorization guard which tenant each finance resource belongs to. */
@Injectable()
export class FinanceScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categories: ExpenseCategoryRepository,
    @Inject(EXPENSE_REPOSITORY) private readonly expenses: ExpenseRepository,
    @Inject(DAILY_CLOSURE_REPOSITORY)
    private readonly closures: DailyClosureRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('expense-category', async (id) => {
      const category = await this.categories.findById(id);
      return category && { organizationId: category.organizationId };
    });
    this.registry.register('expense', async (id) => {
      const expense = await this.expenses.findById(id);
      return expense && { restaurantId: expense.restaurantId };
    });
    this.registry.register('daily-closure', async (id) => {
      const closure = await this.closures.findById(id);
      return closure && { restaurantId: closure.restaurantId };
    });
  }
}
