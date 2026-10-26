import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import type { FindOperator } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { roundMoney } from '../../../../../common/domain/value-objects/money.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Expense } from '../../../../domain/entities/expense.entity.js';
import { ExpenseStatus } from '../../../../domain/enums/expense-status.enum.js';
import {
  DailyExpenseTotals,
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
      total: roundMoney(Number(row?.total ?? 0)),
      cash: roundMoney(Number(row?.cash ?? 0)),
    };
  }
}
