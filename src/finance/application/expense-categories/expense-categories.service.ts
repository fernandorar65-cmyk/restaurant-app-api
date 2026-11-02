import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.js';
import type { ExpenseRepository } from '../../domain/repositories/expense.repository.js';
import { ExpenseCategory } from '../../domain/entities/expense-category.entity.js';
import {
  DuplicateExpenseCategoryNameError,
  ExpenseCategoryNotFoundError,
  OrganizationReferenceNotFoundError,
} from '../../domain/exceptions/finance.errors.js';
import { EXPENSE_CATEGORY_REPOSITORY } from '../../domain/repositories/expense-category.repository.js';
import type { ExpenseCategoryRepository } from '../../domain/repositories/expense-category.repository.js';
import { TENANT_LOOKUP } from '../../../common/application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../common/application/ports/tenant-lookup.port.js';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ExpenseCategoryRepository,
    @Inject(TENANT_LOOKUP)
    private readonly organizationLookup: TenantLookup,
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
  ) {}

  async create(input: {
    organizationId: string;
    name: string;
    description?: string | null;
  }): Promise<ExpenseCategory> {
    if (!(await this.organizationLookup.organizationExists(input.organizationId))) {
      throw new OrganizationReferenceNotFoundError(input.organizationId);
    }
    const category = ExpenseCategory.create({ id: randomUUID(), ...input });
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  findPage(
    filter: { organizationId?: string },
    page: PageRequest,
  ): Promise<Page<ExpenseCategory>> {
    return this.categoryRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<ExpenseCategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new ExpenseCategoryNotFoundError(id);
    }
    return category;
  }

  async update(
    id: string,
    input: { name?: string; description?: string | null; isActive?: boolean },
  ): Promise<ExpenseCategory> {
    const category = await this.findOne(id);
    category.update(input);
    await this.assertNameIsFree(category);
    return this.categoryRepository.save(category);
  }

  /** Logical delete: past expenses keep pointing to it. */
  async deactivate(id: string): Promise<void> {
    const category = await this.findOne(id);
    category.update({ isActive: false });
    await this.categoryRepository.save(category);
  }

  /**
   * Retires the category moving all its expenses (voided ones too) to
   * another active category of the same organization, in one transaction.
   */
  async deactivateMovingExpenses(
    id: string,
    targetId: string,
  ): Promise<{ movedExpenses: number }> {
    const [category, target] = await Promise.all([
      this.findOne(id),
      this.findOne(targetId),
    ]);
    target.assertCanReceiveExpensesOf(category);
    return this.transactionRunner.run(async (tx) => {
      const movedExpenses = await this.expenseRepository.reassignCategory(
        category.id,
        target.id,
        tx,
      );
      category.update({ isActive: false });
      await this.categoryRepository.save(category, tx);
      return { movedExpenses };
    });
  }

  private async assertNameIsFree(category: ExpenseCategory): Promise<void> {
    const existing = await this.categoryRepository.findByName(
      category.organizationId,
      category.name,
    );
    if (existing && existing.id !== category.id) {
      throw new DuplicateExpenseCategoryNameError(category.name);
    }
  }
}
