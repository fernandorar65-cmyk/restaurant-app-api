import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { ExpenseStatus } from '../../../../domain/enums/expense-status.enum.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { InventoryMovementOrmEntity } from '../../../../../inventory/infrastructure/persistence/typeorm/entities/inventory-movement.orm-entity.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import type { ExpenseCategoryOrmEntity } from './expense-category.orm-entity.js';

@Entity('expenses')
@Unique('uq_expenses_inventory_movement', ['inventoryMovementId'])
@Index('idx_expenses_restaurant_date', ['restaurantId', 'expenseDate'])
@Check('chk_expenses_amount', 'amount > 0')
@Check(
  'chk_expenses_method',
  inValues('payment_method', Object.values(PaymentMethod), { nullable: true }),
)
@Check('chk_expenses_status', inValues('status', Object.values(ExpenseStatus)))
export class ExpenseOrmEntity extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity')
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne('ExpenseCategoryOrmEntity')
  @JoinColumn({ name: 'category_id' })
  category?: ExpenseCategoryOrmEntity;

  // Set when the expense comes from an inventory purchase.
  @Column({ name: 'inventory_movement_id', type: 'uuid', nullable: true })
  inventoryMovementId: string | null;

  @OneToOne('InventoryMovementOrmEntity')
  @JoinColumn({ name: 'inventory_movement_id' })
  inventoryMovement?: InventoryMovementOrmEntity;

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

  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'registered_by_user_id' })
  registeredByUser?: UserOrmEntity;

  @Column({ type: 'varchar', length: 20, default: ExpenseStatus.REGISTERED })
  status: ExpenseStatus;
}
