import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { PaymentOrmEntity } from './payment.orm-entity.js';
import type { RefundStatusOrmEntity } from './refund-status.orm-entity.js';

// Refunds are modeled but not enabled yet (pending MVP decision): no service
// writes here, so they never affect the payment flow. The original payment
// is never edited; net collected = paid - refunds whose status counts.
@Entity('refunds')
@Unique('uq_refunds_payment_request', ['paymentId', 'requestId'])
@Index('idx_refunds_payment', ['paymentId'])
@Index('uq_refunds_provider_refund', ['providerCode', 'providerRefundId'], {
  unique: true,
  where: 'provider_refund_id IS NOT NULL',
})
@Check('chk_refunds_amount', 'amount > 0')
@Check(
  'chk_refunds_provider',
  'provider_code IS NOT NULL OR (provider_refund_id IS NULL AND provider_status IS NULL)',
)
export class RefundOrmEntity extends BaseOrmEntity {
  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne('PaymentOrmEntity')
  @JoinColumn({ name: 'payment_id' })
  payment?: PaymentOrmEntity;

  @Column({ name: 'refund_status_id', type: 'uuid' })
  refundStatusId: string;

  @ManyToOne('RefundStatusOrmEntity')
  @JoinColumn({ name: 'refund_status_id' })
  status?: RefundStatusOrmEntity;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ name: 'provider_code', type: 'varchar', length: 50, nullable: true })
  providerCode: string | null;

  @Column({ name: 'provider_refund_id', type: 'varchar', length: 255, nullable: true })
  providerRefundId: string | null;

  @Column({ name: 'provider_status', type: 'varchar', length: 100, nullable: true })
  providerStatus: string | null;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  // Logical reference to an IAM user (no FK across contexts).
  @Column({ name: 'processed_by_user_id', type: 'uuid', nullable: true })
  processedByUserId: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
