import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { AllocationConcept } from '../../../../domain/enums/allocation-concept.enum.js';
import type { PaymentOrmEntity } from './payment.orm-entity.js';

// How a payment is spread over the products (or the delivery fee) of the
// attention. Immutable: refunds never edit these rows.
@Entity('payment_allocations')
@Unique('uq_allocations_payment_item', ['paymentId', 'orderItemId'])
@Index('uq_allocations_payment_delivery_fee', ['paymentId'], {
  unique: true,
  where: `concept = '${AllocationConcept.DELIVERY_FEE}'`,
})
@Index('idx_allocations_order_item', ['orderItemId'])
@Check('chk_allocations_amount', 'allocated_amount > 0')
@Check('chk_allocations_concept', inValues('concept', Object.values(AllocationConcept)))
@Check(
  'chk_allocations_target',
  `(concept = '${AllocationConcept.ORDER_ITEM}') = (order_item_id IS NOT NULL)`,
)
export class PaymentAllocationOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne('PaymentOrmEntity', 'allocations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment?: PaymentOrmEntity;

  @Column({ type: 'varchar', length: 20 })
  concept: AllocationConcept;

  // Logical reference to an attention order item (no FK across contexts).
  @Column({ name: 'order_item_id', type: 'uuid', nullable: true })
  orderItemId: string | null;

  @Column({
    name: 'allocated_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  allocatedAmount: number;
}
