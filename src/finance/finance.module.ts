import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttentionModule } from '../attention/attention.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { DailyClosuresService } from './application/daily-closures/daily-closures.service.js';
import { ExpenseCategoriesService } from './application/expense-categories/expense-categories.service.js';
import { ExpensesService } from './application/expenses/expenses.service.js';
import {
  ATTENTION_STATS,
  ORGANIZATION_LOOKUP,
  SALES_REPORT,
} from './application/ports/finance-lookups.port.js';
import { DAILY_CLOSURE_REPOSITORY } from './domain/repositories/daily-closure.repository.js';
import { EXPENSE_CATEGORY_REPOSITORY } from './domain/repositories/expense-category.repository.js';
import { EXPENSE_REPOSITORY } from './domain/repositories/expense.repository.js';
import { DailyClosuresController } from './infrastructure/http/controllers/daily-closures.controller.js';
import { ExpenseCategoriesController } from './infrastructure/http/controllers/expense-categories.controller.js';
import { ExpensesController } from './infrastructure/http/controllers/expenses.controller.js';
import {
  InternalAttentionStatsAdapter,
  InternalOrganizationLookupAdapter,
  InternalSalesReportAdapter,
} from './infrastructure/lookups/internal-finance-lookups.adapter.js';
import { DailyClosurePaymentTotalOrmEntity } from './infrastructure/persistence/typeorm/entities/daily-closure-payment-total.orm-entity.js';
import { DailyClosureOrmEntity } from './infrastructure/persistence/typeorm/entities/daily-closure.orm-entity.js';
import { ExpenseCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/expense-category.orm-entity.js';
import { ExpenseOrmEntity } from './infrastructure/persistence/typeorm/entities/expense.orm-entity.js';
import { TypeOrmDailyClosureRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-daily-closure.repository.js';
import { TypeOrmExpenseCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-expense-category.repository.js';
import { TypeOrmExpenseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-expense.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseCategoryOrmEntity,
      ExpenseOrmEntity,
      DailyClosureOrmEntity,
      DailyClosurePaymentTotalOrmEntity,
    ]),
    OrganizationsModule,
    PaymentsModule,
    AttentionModule,
  ],
  controllers: [
    ExpenseCategoriesController,
    ExpensesController,
    DailyClosuresController,
  ],
  providers: [
    ExpenseCategoriesService,
    ExpensesService,
    DailyClosuresService,
    {
      provide: EXPENSE_CATEGORY_REPOSITORY,
      useClass: TypeOrmExpenseCategoryRepository,
    },
    { provide: EXPENSE_REPOSITORY, useClass: TypeOrmExpenseRepository },
    { provide: DAILY_CLOSURE_REPOSITORY, useClass: TypeOrmDailyClosureRepository },
    { provide: ORGANIZATION_LOOKUP, useClass: InternalOrganizationLookupAdapter },
    { provide: SALES_REPORT, useClass: InternalSalesReportAdapter },
    { provide: ATTENTION_STATS, useClass: InternalAttentionStatsAdapter },
  ],
})
export class FinanceModule {}
