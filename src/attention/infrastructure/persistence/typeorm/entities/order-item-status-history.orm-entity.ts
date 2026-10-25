import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { OrderItemStatus } from '../../../../domain/enums/order-item-status.enum.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { OrderItemOrmEntity } from './order-item.orm-entity.js';

const ORDER_ITEM_STATUSES = Object.values(OrderItemStatus);

@Entity('order_item_status_history')
@Index('idx_item_history_item_changed', ['orderItemId', 'changedAt'])
@Check(
  'chk_item_history_previous',
  inValues('previous_status', ORDER_ITEM_STATUSES, { nullable: true }),
)
@Check('chk_item_history_new', inValues('new_status', ORDER_ITEM_STATUSES))
@Check(
  'chk_item_history_version',
  'version_before IS NULL OR version_before >= 0',
)
export class OrderItemStatusHistoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @ManyToOne('OrderItemOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem?: OrderItemOrmEntity;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  previousStatus: OrderItemStatus | null;

  @Column({ name: 'new_status', type: 'varchar', length: 20 })
  newStatus: OrderItemStatus;

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
