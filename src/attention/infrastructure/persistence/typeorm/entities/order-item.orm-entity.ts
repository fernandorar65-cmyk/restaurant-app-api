import {
  Check,
  Column,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  VersionColumn,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/infrastructure/persistence/column-options.js';
import type { AttentionParticipantOrmEntity } from './attention-participant.orm-entity.js';
import type { OrderOrmEntity } from './order.orm-entity.js';
import type { OrderStatusOrmEntity } from './workflow-status.orm-entity.js';

// Name and price are snapshotted at order time so later catalog changes never
// alter past orders.
@Entity('order_items')
@Index('idx_order_items_order', ['orderId'])
@Index('idx_order_items_product', ['productId'])
@Index('idx_order_items_status', ['orderStatusId', 'createdAt'])
@Check('chk_order_items_price', 'unit_price >= 0')
@Check('chk_order_items_quantity', 'quantity > 0')
@Check('chk_order_items_subtotal', 'subtotal >= 0')
@Check('chk_order_items_version', 'version >= 0')
export class OrderItemOrmEntity extends BaseOrmEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne('OrderOrmEntity')
  @JoinColumn({ name: 'order_id' })
  order?: OrderOrmEntity;

  @ForeignKey('ProductOrmEntity')
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'requested_by_participant_id', type: 'uuid', nullable: true })
  requestedByParticipantId: string | null;

  @ManyToOne('AttentionParticipantOrmEntity')
  @JoinColumn({ name: 'requested_by_participant_id' })
  requestedByParticipant?: AttentionParticipantOrmEntity;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 150 })
  productNameSnapshot: string;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    name: 'customer_note',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  customerNote: string | null;

  // A REJECTED status requires rejection_reason (checked by the domain:
  // the canonical state lives in order_statuses).
  @Column({ name: 'order_status_id', type: 'uuid' })
  orderStatusId: string;

  @ManyToOne('OrderStatusOrmEntity')
  @JoinColumn({ name: 'order_status_id' })
  status?: OrderStatusOrmEntity;

  @Column({
    name: 'rejection_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  rejectionReason: string | null;

  // Optimistic concurrency between staff updating the same item.
  @VersionColumn({ type: 'int', default: 0 })
  version: number;
}
