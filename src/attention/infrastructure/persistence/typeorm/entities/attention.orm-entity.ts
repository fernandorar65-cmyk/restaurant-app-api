import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  VersionColumn,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { ServiceTypeOrmEntity } from './service-type.orm-entity.js';
import type { AttentionStatusOrmEntity } from './workflow-status.orm-entity.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { DiningTableOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';

// A whole visit/bill. Its status comes from the restaurant's catalog
// (attention_statuses). An attention is active until it is closed or
// cancelled, which always stamps closed_at / cancelled_at: that is what
// uq_attentions_active_table uses to allow one active attention per table
// (a partial index can't look at the status catalog).
@Entity('attentions')
@Unique('uq_attentions_restaurant_number', ['restaurantId', 'attentionNumber'])
@Index('idx_attentions_restaurant_status', [
  'restaurantId',
  'attentionStatusId',
])
@Index('idx_attentions_service_type', ['serviceTypeId'])
@Index('idx_attentions_table', ['diningTableId'])
@Index('idx_attentions_customer', ['customerUserId'])
@Index('uq_attentions_active_table', ['diningTableId'], {
  unique: true,
  where:
    'dining_table_id IS NOT NULL AND closed_at IS NULL AND cancelled_at IS NULL',
})
@Check(
  'chk_attentions_dates',
  '(closed_at IS NULL OR closed_at >= opened_at) AND (cancelled_at IS NULL OR cancelled_at >= opened_at)',
)
@Check('chk_attentions_single_end', 'closed_at IS NULL OR cancelled_at IS NULL')
@Check('chk_attentions_version', 'version >= 0')
export class AttentionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity')
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ name: 'dining_table_id', type: 'uuid', nullable: true })
  diningTableId: string | null;

  @ManyToOne('DiningTableOrmEntity')
  @JoinColumn({ name: 'dining_table_id' })
  diningTable?: DiningTableOrmEntity;

  @Column({ name: 'customer_user_id', type: 'uuid', nullable: true })
  customerUserId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'customer_user_id' })
  customerUser?: UserOrmEntity;

  @Column({ name: 'attention_number', type: 'varchar', length: 50 })
  attentionNumber: string;

  @Column({ name: 'service_type_id', type: 'uuid' })
  serviceTypeId: string;

  @ManyToOne('ServiceTypeOrmEntity')
  @JoinColumn({ name: 'service_type_id' })
  serviceType?: ServiceTypeOrmEntity;

  @Column({ name: 'attention_status_id', type: 'uuid' })
  attentionStatusId: string;

  @ManyToOne('AttentionStatusOrmEntity')
  @JoinColumn({ name: 'attention_status_id' })
  status?: AttentionStatusOrmEntity;

  @Column({ name: 'bill_requested_at', type: 'timestamptz', nullable: true })
  billRequestedAt: Date | null;

  @Column({
    name: 'opened_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({
    name: 'cancellation_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  cancellationReason: string | null;

  @VersionColumn({ type: 'int', default: 0 })
  version: number;
}
