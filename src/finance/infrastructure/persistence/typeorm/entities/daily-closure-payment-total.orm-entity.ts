import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import type { DailyClosureOrmEntity } from './daily-closure.orm-entity.js';

@Entity('daily_closure_payment_totals')
@Check(
  'chk_closure_totals_method',
  inValues('payment_method', Object.values(PaymentMethod)),
)
@Check('chk_closure_totals_amount', 'amount >= 0')
export class DailyClosurePaymentTotalOrmEntity {
  @PrimaryColumn({ name: 'daily_closure_id', type: 'uuid' })
  dailyClosureId: string;

  @PrimaryColumn({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @ManyToOne('DailyClosureOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'daily_closure_id' })
  dailyClosure?: DailyClosureOrmEntity;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
