import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttentionModule } from '../attention/attention.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { PaymentsLedgerModule } from '../payments/payments-ledger.module.js';
import { DailyClosuresService } from './application/daily-closures/daily-closures.service.js';
import { ExpenseCategoriesService } from './application/expense-categories/expense-categories.service.js';
import { ExpensesService } from './application/expenses/expenses.service.js';
import {
  ATTENTION_STATS,
  SALES_REPORT,
} from './application/ports/finance-lookups.port.js';
import { DAILY_CLOSURE_REPOSITORY } from './domain/repositories/daily-closure.repository.js';
import { EXPENSE_CATEGORY_REPOSITORY } from './domain/repositories/expense-category.repository.js';
import { EXPENSE_REPOSITORY } from './domain/repositories/expense.repository.js';
import { DailyClosuresController } from './infrastructure/http/controllers/daily-closures.controller.js';
import { FinanceScopeResolvers } from './infrastructure/http/finance-scope-resolvers.js';
import { ExpenseCategoriesController } from './infrastructure/http/controllers/expense-categories.controller.js';
import { ExpensesController } from './infrastructure/http/controllers/expenses.controller.js';
import {
  InternalAttentionStatsAdapter,
  InternalSalesReportAdapter,
} from './infrastructure/lookups/internal-finance-lookups.adapter.js';
import { DailyClosurePaymentTotalOrmEntity } from './infrastructure/persistence/typeorm/entities/daily-closure-payment-total.orm-entity.js';
import { DailyClosureOrmEntity } from './infrastructure/persistence/typeorm/entities/daily-closure.orm-entity.js';
import { ExpenseCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/expense-category.orm-entity.js';
import { ExpenseOrmEntity } from './infrastructure/persistence/typeorm/entities/expense.orm-entity.js';
import { TypeOrmDailyClosureRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-daily-closure.repository.js';
import { TypeOrmExpenseCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-expense-category.repository.js';
import { TypeOrmExpenseRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-expense.repository.js';
import { FinancialReportsService } from './application/reports/financial-reports.service.js';
import { ReportsController } from './infrastructure/http/controllers/reports.controller.js';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/infrastructure/persistence/typeorm-transaction-runner.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseCategoryOrmEntity,
      ExpenseOrmEntity,
      DailyClosureOrmEntity,
      DailyClosurePaymentTotalOrmEntity,
    ]),
    OrganizationsModule,
    PaymentsLedgerModule,
    AttentionModule,
  ],
  controllers: [
    ExpenseCategoriesController,
    ExpensesController,
    DailyClosuresController,
    ReportsController,
  ],
  providers: [
    FinanceScopeResolvers,
    ExpenseCategoriesService,
    ExpensesService,
    DailyClosuresService,
    FinancialReportsService,
    {
      provide: EXPENSE_CATEGORY_REPOSITORY,
      useClass: TypeOrmExpenseCategoryRepository,
    },
    { provide: EXPENSE_REPOSITORY, useClass: TypeOrmExpenseRepository },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
    { provide: DAILY_CLOSURE_REPOSITORY, useClass: TypeOrmDailyClosureRepository },
    { provide: SALES_REPORT, useClass: InternalSalesReportAdapter },
    { provide: ATTENTION_STATS, useClass: InternalAttentionStatsAdapter },
  ],
})
export class FinanceModule {}
