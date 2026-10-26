import { DailyClosure } from '../../../../domain/entities/daily-closure.entity.js';
import { ExpenseCategory } from '../../../../domain/entities/expense-category.entity.js';
import { Expense } from '../../../../domain/entities/expense.entity.js';
import { DailyClosurePaymentTotalOrmEntity } from '../entities/daily-closure-payment-total.orm-entity.js';
import { DailyClosureOrmEntity } from '../entities/daily-closure.orm-entity.js';
import { ExpenseCategoryOrmEntity } from '../entities/expense-category.orm-entity.js';
import { ExpenseOrmEntity } from '../entities/expense.orm-entity.js';

export class ExpenseCategoryMapper {
  static toDomain(orm: ExpenseCategoryOrmEntity): ExpenseCategory {
    return ExpenseCategory.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      name: orm.name,
      description: orm.description,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: ExpenseCategory,
    existing?: ExpenseCategoryOrmEntity,
  ): ExpenseCategoryOrmEntity {
    const orm = existing ?? new ExpenseCategoryOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class ExpenseMapper {
  static toDomain(orm: ExpenseOrmEntity): Expense {
    return Expense.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      categoryId: orm.categoryId,
      inventoryMovementId: orm.inventoryMovementId,
      description: orm.description,
      amount: orm.amount,
      expenseDate: orm.expenseDate,
      paymentMethod: orm.paymentMethod,
      registeredByUserId: orm.registeredByUserId,
      status: orm.status,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: Expense, existing?: ExpenseOrmEntity): ExpenseOrmEntity {
    const orm = existing ?? new ExpenseOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.categoryId = domain.categoryId;
    orm.inventoryMovementId = domain.inventoryMovementId;
    orm.description = domain.description;
    orm.amount = domain.amount;
    orm.expenseDate = domain.expenseDate;
    orm.paymentMethod = domain.paymentMethod;
    orm.registeredByUserId = domain.registeredByUserId;
    orm.status = domain.status;
    return orm;
  }
}

export class DailyClosureMapper {
  static toDomain(
    orm: DailyClosureOrmEntity,
    totals: DailyClosurePaymentTotalOrmEntity[],
  ): DailyClosure {
    return DailyClosure.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      businessDate: orm.businessDate,
      openedAttentions: orm.openedAttentions,
      closedAttentions: orm.closedAttentions,
      cancelledAttentions: orm.cancelledAttentions,
      grossSales: orm.grossSales,
      refundedAmount: orm.refundedAmount,
      netSales: orm.netSales,
      expenseAmount: orm.expenseAmount,
      expectedCash: orm.expectedCash,
      actualCash: orm.actualCash,
      differenceAmount: orm.differenceAmount,
      notes: orm.notes,
      closedByUserId: orm.closedByUserId,
      closedAt: orm.closedAt,
      paymentTotals: totals.map((total) => ({
        method: total.paymentMethod,
        amount: total.amount,
      })),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: DailyClosure): DailyClosureOrmEntity {
    const orm = new DailyClosureOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.businessDate = domain.businessDate;
    orm.openedAttentions = domain.openedAttentions;
    orm.closedAttentions = domain.closedAttentions;
    orm.cancelledAttentions = domain.cancelledAttentions;
    orm.grossSales = domain.grossSales;
    orm.refundedAmount = domain.refundedAmount;
    orm.netSales = domain.netSales;
    orm.expenseAmount = domain.expenseAmount;
    orm.expectedCash = domain.expectedCash;
    orm.actualCash = domain.actualCash;
    orm.differenceAmount = domain.differenceAmount;
    orm.notes = domain.notes;
    orm.closedByUserId = domain.closedByUserId;
    orm.closedAt = domain.closedAt;
    return orm;
  }
}
