import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { RefundStatus } from '../../../../domain/enums/refund-status.enum.js';
import type { PaymentOrmEntity } from './payment.orm-entity.js';

@Entity('refunds')
@Index('idx_refunds_payment_status', ['paymentId', 'status'])
@Check('chk_refunds_amount', 'amount > 0')
@Check('chk_refunds_status', inValues('status', Object.values(RefundStatus)))
@Check(
  'chk_refunds_refunded_at',
  `status <> '${RefundStatus.REFUNDED}' OR refunded_at IS NOT NULL`,
)
export class RefundOrmEntity extends BaseOrmEntity {
  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne('PaymentOrmEntity')
  @JoinColumn({ name: 'payment_id' })
  payment?: PaymentOrmEntity;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'varchar', length: 20, default: RefundStatus.PENDING })
  status: RefundStatus;

  @Column({
    name: 'external_reference',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  externalReference: string | null;

  // Logical reference to an IAM user (no FK across contexts).
  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date | null;
}
