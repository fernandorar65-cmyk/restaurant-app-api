import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { OrderItemOrmEntity } from './order-item.orm-entity.js';
import type { OrderStatusOrmEntity } from './workflow-status.orm-entity.js';

// Insert-only. Statuses are never deleted (only deactivated), so the ids
// keep pointing to a readable code and name.
@Entity('order_item_status_history')
@Index('idx_item_history_item_changed', ['orderItemId', 'changedAt'])
@Check(
  'chk_item_history_version',
  'version_before IS NULL OR version_before >= 0',
)
export class OrderItemStatusHistoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @ManyToOne('OrderItemOrmEntity')
  @JoinColumn({ name: 'order_item_id' })
  orderItem?: OrderItemOrmEntity;

  @Column({ name: 'previous_status_id', type: 'uuid', nullable: true })
  previousStatusId: string | null;

  @ManyToOne('OrderStatusOrmEntity')
  @JoinColumn({ name: 'previous_status_id' })
  previousStatus?: OrderStatusOrmEntity | null;

  @Column({ name: 'new_status_id', type: 'uuid' })
  newStatusId: string;

  @ManyToOne('OrderStatusOrmEntity')
  @JoinColumn({ name: 'new_status_id' })
  newStatus?: OrderStatusOrmEntity;

  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser?: UserOrmEntity;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  @Column({
    name: 'changed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  changedAt: Date;

  @Column({ name: 'version_before', type: 'int', nullable: true })
  versionBefore: number | null;
}
