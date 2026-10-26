import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { PaymentAllocationOrmEntity } from './payment-allocation.orm-entity.js';
import type { RefundOrmEntity } from './refund.orm-entity.js';

// Which part of each payment allocation a refund gives back, so the balance
// of a product can be restored without editing payment_allocations. Modeled
// only: partial refunds per product are still a pending MVP decision.
@Entity('refund_allocations')
@Unique('uq_refund_allocations_refund_allocation', ['refundId', 'paymentAllocationId'])
@Index('idx_refund_allocations_payment_allocation', ['paymentAllocationId'])
@Check('chk_refund_allocations_amount', 'refunded_amount > 0')
export class RefundAllocationOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'refund_id', type: 'uuid' })
  refundId: string;

  @ManyToOne('RefundOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refund_id' })
  refund?: RefundOrmEntity;

  @Column({ name: 'payment_allocation_id', type: 'uuid' })
  paymentAllocationId: string;

  @ManyToOne('PaymentAllocationOrmEntity')
  @JoinColumn({ name: 'payment_allocation_id' })
  paymentAllocation?: PaymentAllocationOrmEntity;

  @Column({
    name: 'refunded_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  refundedAmount: number;
}
