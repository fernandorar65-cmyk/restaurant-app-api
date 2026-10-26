import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { PaymentStatusOrmEntity } from './payment-status.orm-entity.js';

// citext: "APPROVED" and "approved" from the same gateway are one status.
@Entity('payment_provider_status_mappings')
@Unique('uq_payment_provider_mappings_status', ['providerCode', 'externalStatus'])
@Index('idx_payment_provider_mappings_status', ['paymentStatusId'])
export class PaymentProviderStatusMappingOrmEntity extends BaseOrmEntity {
  @Column({ name: 'provider_code', type: 'varchar', length: 50 })
  providerCode: string;

  @Column({ name: 'external_status', type: 'citext' })
  externalStatus: string;

  @Column({ name: 'payment_status_id', type: 'uuid' })
  paymentStatusId: string;

  @ManyToOne('PaymentStatusOrmEntity', { eager: true })
  @JoinColumn({ name: 'payment_status_id' })
  paymentStatus: PaymentStatusOrmEntity;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
