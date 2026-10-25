import { Check, Column, Entity, Index, Unique } from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { PaymentStatus } from '../../../../domain/enums/payment-status.enum.js';

// organization_id, restaurant_id, attention_id, payer_user_id and
// registered_by_user_id are logical references to other contexts: no FK, the
// application layer validates them through ports.
@Entity('payments')
@Unique('uq_payments_restaurant_request', ['restaurantId', 'requestId'])
@Index('idx_payments_attention_status', ['attentionId', 'status'])
@Index('idx_payments_restaurant_paid_at', ['restaurantId', 'paidAt'])
@Index(
  'uq_payments_provider_reference',
  ['restaurantId', 'provider', 'externalReference'],
  {
    unique: true,
    where: 'provider IS NOT NULL AND external_reference IS NOT NULL',
  },
)
@Check('chk_payments_amount', 'amount > 0')
@Check(
  'chk_payments_method',
  inValues('payment_method', Object.values(PaymentMethod)),
)
@Check('chk_payments_status', inValues('status', Object.values(PaymentStatus)))
@Check(
  'chk_payments_paid_at',
  `status NOT IN ('${PaymentStatus.PAID}', '${PaymentStatus.PARTIALLY_REFUNDED}', '${PaymentStatus.REFUNDED}') OR paid_at IS NOT NULL`,
)
export class PaymentOrmEntity extends BaseOrmEntity {
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @Column({ name: 'attention_id', type: 'uuid' })
  attentionId: string;

  @Column({ name: 'payer_user_id', type: 'uuid', nullable: true })
  payerUserId: string | null;

  @Column({ name: 'registered_by_user_id', type: 'uuid', nullable: true })
  registeredByUserId: string | null;

  @Column({ name: 'payer_name', type: 'varchar', length: 150, nullable: true })
  payerName: string | null;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'PEN' })
  currencyCode: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string | null;

  @Column({
    name: 'external_reference',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  externalReference: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;
}
