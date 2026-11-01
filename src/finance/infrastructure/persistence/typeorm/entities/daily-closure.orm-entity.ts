import { Check, Column, Entity, ForeignKey, Index, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/infrastructure/persistence/column-options.js';

const money = {
  type: 'numeric' as const,
  precision: 14,
  scale: 2,
  transformer: decimalTransformer,
};

// Snapshot of the day's figures at the moment the closure was registered.
@Entity('daily_closures')
@Unique('uq_daily_closures_restaurant_date', ['restaurantId', 'businessDate'])
@Index('idx_daily_closures_restaurant_date', ['restaurantId', 'businessDate'])
@Check(
  'chk_daily_closures_counts',
  'opened_attentions >= 0 AND closed_attentions >= 0 AND cancelled_attentions >= 0',
)
@Check(
  'chk_daily_closures_amounts',
  'gross_sales >= 0 AND refunded_amount >= 0 AND expense_amount >= 0 AND expected_cash >= 0',
)
export class DailyClosureOrmEntity extends BaseOrmEntity {
  @ForeignKey('RestaurantOrmEntity')
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  // DATE columns come back from pg as 'YYYY-MM-DD' strings.
  @Column({ name: 'business_date', type: 'date' })
  businessDate: string;

  @Column({ name: 'opened_attentions', type: 'int', default: 0 })
  openedAttentions: number;

  @Column({ name: 'closed_attentions', type: 'int', default: 0 })
  closedAttentions: number;

  @Column({ name: 'cancelled_attentions', type: 'int', default: 0 })
  cancelledAttentions: number;

  @Column({ ...money, name: 'gross_sales', default: 0 })
  grossSales: number;

  @Column({ ...money, name: 'refunded_amount', default: 0 })
  refundedAmount: number;

  @Column({ ...money, name: 'net_sales', default: 0 })
  netSales: number;

  @Column({ ...money, name: 'expense_amount', default: 0 })
  expenseAmount: number;

  @Column({ ...money, name: 'expected_cash', default: 0 })
  expectedCash: number;

  @Column({ ...money, name: 'actual_cash', nullable: true })
  actualCash: number | null;

  @Column({ ...money, name: 'difference_amount', nullable: true })
  differenceAmount: number | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes: string | null;

  @ForeignKey('UserOrmEntity')
  @Column({ name: 'closed_by_user_id', type: 'uuid' })
  closedByUserId: string;

  @Column({
    name: 'closed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  closedAt: Date;
}
