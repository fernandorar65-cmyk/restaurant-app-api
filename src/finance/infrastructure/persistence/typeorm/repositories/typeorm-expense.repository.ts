import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import type { FindOperator } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/domain/pagination.js';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { Money } from '../../../../../common/domain/value-objects/money.js';
import { TypeOrmBaseRepository } from '../../../../../common/infrastructure/persistence/typeorm-base.repository.js';
import { Expense } from '../../../../domain/entities/expense.entity.js';
import { ExpenseStatus } from '../../../../domain/enums/expense-status.enum.js';
import {
  DailyExpenseTotals,
  DatedExpenseTotals,
  ExpenseFilter,
  ExpenseRepository,
} from '../../../../domain/repositories/expense.repository.js';
import { ExpenseOrmEntity } from '../entities/expense.orm-entity.js';
import { ExpenseMapper } from '../mappers/finance.mappers.js';

export function dateRange(from?: string, to?: string): FindOperator<string> | undefined {
  if (from && to) {
    return Between(from, to);
  }
  if (from) {
    return MoreThanOrEqual(from);
  }
  return to ? LessThanOrEqual(to) : undefined;
}

@Injectable()
export class TypeOrmExpenseRepository
  extends TypeOrmBaseRepository<Expense, ExpenseOrmEntity>
  implements ExpenseRepository
{
  constructor(
    @InjectRepository(ExpenseOrmEntity)
    repository: Repository<ExpenseOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: ExpenseOrmEntity): Expense {
    return ExpenseMapper.toDomain(orm);
  }

  protected toPersistence(domain: Expense, existing?: ExpenseOrmEntity): ExpenseOrmEntity {
    return ExpenseMapper.toPersistence(domain, existing);
  }

  findPage(filter: ExpenseFilter, page: PageRequest): Promise<Page<Expense>> {
    return this.findPageBy(
      {
        where: {
          restaurantId: filter.restaurantId,
          categoryId: filter.categoryId,
          status: filter.status,
          expenseDate: dateRange(filter.from, filter.to),
        },
        order: { expenseDate: 'DESC', createdAt: 'DESC' },
      },
      page,
    );
  }

  async dailyTotals(
    restaurantId: string,
    businessDate: string,
  ): Promise<DailyExpenseTotals> {
    const row = await this.repository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .addSelect(
        'COALESCE(SUM(expense.amount) FILTER (WHERE expense.payment_method = :cash), 0)',
        'cash',
      )
      .where('expense.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('expense.expense_date = :businessDate', { businessDate })
      .andWhere('expense.status = :registered', {
        registered: ExpenseStatus.REGISTERED,
      })
      .setParameter('cash', PaymentMethod.CASH)
      .getRawOne<{ total: string; cash: string }>();
    return {
      total: Money.parse(row?.total).amount,
      cash: Money.parse(row?.cash).amount,
    };
  }

  async reassignCategory(
    fromCategoryId: string,
    toCategoryId: string,
    tx: TransactionContext,
  ): Promise<number> {
    const result = await this.getRepository(tx).update(
      { categoryId: fromCategoryId },
      { categoryId: toCategoryId },
    );
    return result.affected ?? 0;
  }

  async totalsByDate(
    restaurantId: string,
    from: string,
    to: string,
  ): Promise<DatedExpenseTotals[]> {
    const rows = await this.repository
      .createQueryBuilder('expense')
      .select("to_char(expense.expense_date, 'YYYY-MM-DD')", 'businessDate')
      .addSelect('SUM(expense.amount)', 'total')
      .addSelect(
        'COALESCE(SUM(expense.amount) FILTER (WHERE expense.payment_method = :cash), 0)',
        'cash',
      )
      .where('expense.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('expense.expense_date BETWEEN :from AND :to', { from, to })
      .andWhere('expense.status = :registered', {
        registered: ExpenseStatus.REGISTERED,
      })
      .setParameter('cash', PaymentMethod.CASH)
      .groupBy('expense.expense_date')
      .orderBy('expense.expense_date')
      .getRawMany<{ businessDate: string; total: string; cash: string }>();
    return rows.map((row) => ({
      businessDate: row.businessDate,
      total: Money.parse(row.total).amount,
      cash: Money.parse(row.cash).amount,
    }));
  }
}
