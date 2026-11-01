import {
  Check,
  Column,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/infrastructure/persistence/column-options.js';
import { ExpenseStatus } from '../../../../domain/enums/expense-status.enum.js';
import type { ExpenseCategoryOrmEntity } from './expense-category.orm-entity.js';

@Entity('expenses')
// Former OneToOne constraint, redundant with uq_expenses_inventory_movement;
// kept so the schema doesn't change (drop it in a migration).
@Unique('REL_7bc3ff8f94e0c68d19a1d85526', ['inventoryMovementId'])
@Unique('uq_expenses_inventory_movement', ['inventoryMovementId'])
@Index('idx_expenses_restaurant_date', ['restaurantId', 'expenseDate'])
@Check('chk_expenses_amount', 'amount > 0')
@Check(
  'chk_expenses_method',
  inValues('payment_method', Object.values(PaymentMethod), { nullable: true }),
)
@Check('chk_expenses_status', inValues('status', Object.values(ExpenseStatus)))
export class ExpenseOrmEntity extends BaseOrmEntity {
  @ForeignKey('RestaurantOrmEntity')
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne('ExpenseCategoryOrmEntity')
  @JoinColumn({ name: 'category_id' })
  category?: ExpenseCategoryOrmEntity;

  // Set when the expense comes from an inventory purchase.
  @ForeignKey('InventoryMovementOrmEntity')
  @Column({ name: 'inventory_movement_id', type: 'uuid', nullable: true })
  inventoryMovementId: string | null;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  // DATE columns come back from pg as 'YYYY-MM-DD' strings.
  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  paymentMethod: PaymentMethod | null;

  @ForeignKey('UserOrmEntity')
  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @Column({ type: 'varchar', length: 20, default: ExpenseStatus.REGISTERED })
  status: ExpenseStatus;
}
