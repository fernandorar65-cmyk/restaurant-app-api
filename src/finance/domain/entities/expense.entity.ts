import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import type { PaymentMethod } from '../../../common/domain/payment-method.enum.js';
import { BusinessDate } from '../../../common/domain/value-objects/business-date.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { ExpenseStatus } from '../enums/expense-status.enum.js';
import { ExpenseVoidedError } from '../exceptions/finance.errors.js';

export interface ExpenseProps {
  id: string;
  restaurantId: string;
  categoryId: string;
  inventoryMovementId: string | null;
  description: string;
  amount: number;
  /** Business date 'YYYY-MM-DD'. */
  expenseDate: string;
  paymentMethod: PaymentMethod | null;
  registeredByUserId: string | null;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseDetails {
  categoryId?: string;
  description?: string;
  amount?: number;
  expenseDate?: string;
  paymentMethod?: PaymentMethod | null;
}

/**
 * A restaurant expense. Financial records are never deleted: a mistaken
 * expense is VOIDED, which keeps it auditable and out of the totals.
 */
export class Expense {
  private constructor(private props: ExpenseProps) {}

  static register(
    params: ExpenseDetails & {
      id: string;
      restaurantId: string;
      categoryId: string;
      description: string;
      amount: number;
      expenseDate: string;
      registeredByUserId?: string | null;
      inventoryMovementId?: string | null;
    },
  ): Expense {
    const now = new Date();
    const expense = new Expense({
      id: params.id,
      restaurantId: params.restaurantId,
      categoryId: params.categoryId,
      inventoryMovementId: params.inventoryMovementId ?? null,
      description: '',
      amount: 0,
      expenseDate: '',
      paymentMethod: null,
      registeredByUserId: params.registeredByUserId ?? null,
      status: ExpenseStatus.REGISTERED,
      createdAt: now,
      updatedAt: now,
    });
    expense.apply(params);
    return expense;
  }

  static fromPersistence(props: ExpenseProps): Expense {
    return new Expense(props);
  }

  update(params: ExpenseDetails): void {
    this.assertRegistered();
    this.apply(params);
    this.props.updatedAt = new Date();
  }

  void(): void {
    this.assertRegistered();
    this.props.status = ExpenseStatus.VOIDED;
    this.props.updatedAt = new Date();
  }

  private assertRegistered(): void {
    if (this.props.status === ExpenseStatus.VOIDED) {
      throw new ExpenseVoidedError();
    }
  }

  private apply(params: ExpenseDetails): void {
    if (params.categoryId !== undefined) {
      this.props.categoryId = params.categoryId;
    }
    if (params.description !== undefined) {
      this.props.description = requireText(params.description, 'La descripción', {
        max: 500,
      });
    }
    if (params.amount !== undefined) {
      if (params.amount <= 0) {
        throw new ValidationDomainError('El monto del gasto debe ser mayor a 0');
      }
      this.props.amount = roundMoney(params.amount);
    }
    if (params.expenseDate !== undefined) {
      this.props.expenseDate = BusinessDate.create(params.expenseDate).value;
    }
    if (params.paymentMethod !== undefined) {
      this.props.paymentMethod = params.paymentMethod;
    }
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get categoryId(): string {
    return this.props.categoryId;
  }
  get inventoryMovementId(): string | null {
    return this.props.inventoryMovementId;
  }
  get description(): string {
    return this.props.description;
  }
  get amount(): number {
    return this.props.amount;
  }
  get expenseDate(): string {
    return this.props.expenseDate;
  }
  get paymentMethod(): PaymentMethod | null {
    return this.props.paymentMethod;
  }
  get registeredByUserId(): string | null {
    return this.props.registeredByUserId;
  }
  get status(): ExpenseStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
