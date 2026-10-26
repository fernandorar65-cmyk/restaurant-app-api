import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { Expense } from '../../domain/entities/expense.entity.js';
import type { ExpenseDetails } from '../../domain/entities/expense.entity.js';
import {
  CategoryFromAnotherOrganizationError,
  ExpenseNotFoundError,
  InactiveExpenseCategoryError,
  RestaurantReferenceNotFoundError,
} from '../../domain/exceptions/finance.errors.js';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.js';
import type {
  ExpenseFilter,
  ExpenseRepository,
} from '../../domain/repositories/expense.repository.js';
import { ExpenseCategoriesService } from '../expense-categories/expense-categories.service.js';
import { ORGANIZATION_LOOKUP } from '../ports/finance-lookups.port.js';
import type { OrganizationLookupPort } from '../ports/finance-lookups.port.js';

export interface RegisterExpenseInput extends ExpenseDetails {
  restaurantId: string;
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
}

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: ExpenseRepository,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookupPort,
    private readonly categoriesService: ExpenseCategoriesService,
  ) {}

  async register(
    input: RegisterExpenseInput,
    registeredByUserId: string | null,
  ): Promise<Expense> {
    await this.assertCategoryFits(input.categoryId, input.restaurantId);
    return this.expenseRepository.save(
      Expense.register({ ...input, id: randomUUID(), registeredByUserId }),
    );
  }

  findPage(filter: ExpenseFilter, page: PageRequest): Promise<Page<Expense>> {
    return this.expenseRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new ExpenseNotFoundError(id);
    }
    return expense;
  }

  async update(id: string, input: ExpenseDetails): Promise<Expense> {
    const expense = await this.findOne(id);
    if (input.categoryId) {
      await this.assertCategoryFits(input.categoryId, expense.restaurantId);
    }
    expense.update(input);
    return this.expenseRepository.save(expense);
  }

  /** Voided expenses stay on record but no longer count in any total. */
  async void(id: string): Promise<Expense> {
    const expense = await this.findOne(id);
    expense.void();
    return this.expenseRepository.save(expense);
  }

  private async assertCategoryFits(
    categoryId: string,
    restaurantId: string,
  ): Promise<void> {
    const restaurant = await this.organizationLookup.findRestaurant(restaurantId);
    if (!restaurant) {
      throw new RestaurantReferenceNotFoundError(restaurantId);
    }
    const category = await this.categoriesService.findOne(categoryId);
    if (category.organizationId !== restaurant.organizationId) {
      throw new CategoryFromAnotherOrganizationError();
    }
    if (!category.isActive) {
      throw new InactiveExpenseCategoryError();
    }
  }
}
