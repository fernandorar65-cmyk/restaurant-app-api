import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { PaymentOrmEntity } from './payment.orm-entity.js';

@Entity('payment_allocations')
@Unique('uq_allocations_payment_item', ['paymentId', 'orderItemId'])
@Index('idx_allocations_order_item', ['orderItemId'])
@Check('chk_allocations_quantity', 'quantity IS NULL OR quantity > 0')
@Check('chk_allocations_amount', 'amount > 0')
export class PaymentAllocationOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne('PaymentOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment?: PaymentOrmEntity;

  // Logical reference to an attention order item (no FK across contexts).
  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  // Fractional so one item can be split between several payers.
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  quantity: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;
}
