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
import { inValues } from '../../../../../common/persistence/column-options.js';
import { AttentionStatus } from '../../../../domain/enums/attention-status.enum.js';
import { ServiceType } from '../../../../domain/enums/service-type.enum.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { DiningTableOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/dining-table.orm-entity.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';

// A whole visit/bill. A table can only have one active (OPEN or
// BILL_REQUESTED) attention at a time, enforced by uq_attentions_active_table.
@Entity('attentions')
@Unique('uq_attentions_restaurant_number', ['restaurantId', 'attentionNumber'])
@Index('idx_attentions_restaurant_status', ['restaurantId', 'status'])
@Index('idx_attentions_table', ['diningTableId'])
@Index('idx_attentions_customer', ['customerUserId'])
@Index('uq_attentions_active_table', ['diningTableId'], {
  unique: true,
  where: `dining_table_id IS NOT NULL AND status IN ('${AttentionStatus.OPEN}', '${AttentionStatus.BILL_REQUESTED}')`,
})
@Check(
  'chk_attentions_service_type',
  inValues('service_type', Object.values(ServiceType)),
)
@Check(
  'chk_attentions_status',
  inValues('status', Object.values(AttentionStatus)),
)
@Check(
  'chk_attentions_table_by_service',
  `(service_type = 'DINE_IN' AND dining_table_id IS NOT NULL) OR (service_type IN ('PICKUP', 'DELIVERY') AND dining_table_id IS NULL)`,
)
@Check(
  'chk_attentions_dates',
  '(closed_at IS NULL OR closed_at >= opened_at) AND (cancelled_at IS NULL OR cancelled_at >= opened_at)',
)
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

  @Column({ name: 'service_type', type: 'varchar', length: 20 })
  serviceType: ServiceType;

  @Column({ type: 'varchar', length: 30, default: AttentionStatus.OPEN })
  status: AttentionStatus;

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
