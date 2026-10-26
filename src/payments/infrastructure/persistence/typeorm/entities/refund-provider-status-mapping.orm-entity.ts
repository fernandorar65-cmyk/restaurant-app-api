import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { RefundStatusOrmEntity } from './refund-status.orm-entity.js';

// Modeled for when refunds are enabled; not used by any flow yet.
@Entity('refund_provider_status_mappings')
@Unique('uq_refund_provider_mappings_status', ['providerCode', 'externalStatus'])
@Index('idx_refund_provider_mappings_status', ['refundStatusId'])
export class RefundProviderStatusMappingOrmEntity extends BaseOrmEntity {
  @Column({ name: 'provider_code', type: 'varchar', length: 50 })
  providerCode: string;

  @Column({ name: 'external_status', type: 'citext' })
  externalStatus: string;

  @Column({ name: 'refund_status_id', type: 'uuid' })
  refundStatusId: string;

  @ManyToOne('RefundStatusOrmEntity')
  @JoinColumn({ name: 'refund_status_id' })
  refundStatus?: RefundStatusOrmEntity;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
