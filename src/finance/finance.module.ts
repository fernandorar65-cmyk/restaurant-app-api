import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyClosurePaymentTotalOrmEntity } from './infrastructure/persistence/typeorm/entities/daily-closure-payment-total.orm-entity.js';
import { DailyClosureOrmEntity } from './infrastructure/persistence/typeorm/entities/daily-closure.orm-entity.js';
import { ExpenseCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/expense-category.orm-entity.js';
import { ExpenseOrmEntity } from './infrastructure/persistence/typeorm/entities/expense.orm-entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseCategoryOrmEntity,
      ExpenseOrmEntity,
      DailyClosureOrmEntity,
      DailyClosurePaymentTotalOrmEntity,
    ]),
  ],
})
export class FinanceModule {}
