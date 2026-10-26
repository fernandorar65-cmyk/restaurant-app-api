import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { AllocationMode } from '../../../../domain/enums/allocation-mode.enum.js';
import type { PaymentAllocationOrmEntity } from './payment-allocation.orm-entity.js';
import type { PaymentStatusOrmEntity } from './payment-status.orm-entity.js';

// organization_id, restaurant_id, attention_id, payer_user_id and
// registered_by_user_id are logical references to other contexts: no FK, the
// application layer validates them through ports.
@Entity('payments')
@Unique('uq_payments_restaurant_request', ['restaurantId', 'requestId'])
@Index('idx_payments_attention', ['attentionId'])
@Index('idx_payments_restaurant_paid_at', ['restaurantId', 'paidAt'])
@Index('idx_payments_status', ['paymentStatusId'])
@Index('uq_payments_provider_payment', ['providerCode', 'providerPaymentId'], {
  unique: true,
  where: 'provider_payment_id IS NOT NULL',
})
@Check('chk_payments_amount', 'amount > 0')
@Check('chk_payments_method', inValues('payment_method', Object.values(PaymentMethod)))
@Check('chk_payments_mode', inValues('allocation_mode', Object.values(AllocationMode)))
@Check(
  'chk_payments_provider',
  'provider_code IS NOT NULL OR (provider_payment_id IS NULL AND provider_status IS NULL)',
)
export class PaymentOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @Column({ name: 'attention_id', type: 'uuid' })
  attentionId: string;

  @Column({ name: 'payment_status_id', type: 'uuid' })
  paymentStatusId: string;

  @ManyToOne('PaymentStatusOrmEntity', { eager: true })
  @JoinColumn({ name: 'payment_status_id' })
  status: PaymentStatusOrmEntity;

  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @Column({ name: 'allocation_mode', type: 'varchar', length: 10 })
  allocationMode: AllocationMode;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode: string;

  @Column({ name: 'payer_user_id', type: 'uuid', nullable: true })
  payerUserId: string | null;

  @Column({ name: 'payer_name', type: 'varchar', length: 150, nullable: true })
  payerName: string | null;

  // Manual reference (e.g. Yape operation number) when no gateway is involved.
  @Column({ name: 'external_reference', type: 'varchar', length: 255, nullable: true })
  externalReference: string | null;

  @Column({ name: 'provider_code', type: 'varchar', length: 50, nullable: true })
  providerCode: string | null;

  @Column({ name: 'provider_payment_id', type: 'varchar', length: 255, nullable: true })
  providerPaymentId: string | null;

  // Last status exactly as the gateway reported it; the domain uses the
  // translated internal status instead.
  @Column({ name: 'provider_status', type: 'varchar', length: 100, nullable: true })
  providerStatus: string | null;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @OneToMany('PaymentAllocationOrmEntity', 'payment')
  allocations?: PaymentAllocationOrmEntity[];
}
