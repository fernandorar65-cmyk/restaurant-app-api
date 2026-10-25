import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  VersionColumn,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { OrderItemStatus } from '../../../../domain/enums/order-item-status.enum.js';
import type { ProductOrmEntity } from '../../../../../catalog/infrastructure/persistence/typeorm/entities/product.orm-entity.js';
import type { AttentionParticipantOrmEntity } from './attention-participant.orm-entity.js';
import type { OrderBatchOrmEntity } from './order-batch.orm-entity.js';

// Name and price are snapshotted at order time so later catalog changes never
// alter past orders.
@Entity('order_items')
@Index('idx_order_items_batch', ['batchId'])
@Index('idx_order_items_product', ['productId'])
@Index('idx_order_items_status', ['currentStatus', 'createdAt'])
@Check('chk_order_items_price', 'unit_price >= 0')
@Check('chk_order_items_quantity', 'quantity > 0')
@Check('chk_order_items_subtotal', 'subtotal >= 0')
@Check(
  'chk_order_items_status',
  inValues('current_status', Object.values(OrderItemStatus)),
)
@Check(
  'chk_order_items_rejection',
  `current_status <> '${OrderItemStatus.REJECTED}' OR rejection_reason IS NOT NULL`,
)
@Check('chk_order_items_version', 'version >= 0')
export class OrderItemOrmEntity extends BaseOrmEntity {
  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @ManyToOne('OrderBatchOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch?: OrderBatchOrmEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne('ProductOrmEntity')
  @JoinColumn({ name: 'product_id' })
  product?: ProductOrmEntity;

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

  @Column({
    name: 'current_status',
    type: 'varchar',
    length: 20,
    default: OrderItemStatus.SUBMITTED,
  })
  currentStatus: OrderItemStatus;

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
