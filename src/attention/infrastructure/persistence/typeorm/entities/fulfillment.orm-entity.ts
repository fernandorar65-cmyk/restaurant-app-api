import { Check, Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { FulfillmentStatus } from '../../../../domain/enums/fulfillment-status.enum.js';
import { FulfillmentType } from '../../../../domain/enums/fulfillment-type.enum.js';
import type { AttentionOrmEntity } from './attention.orm-entity.js';

// Pickup/delivery details of an attention (at most one per attention).
@Entity('fulfillments')
@Unique('uq_fulfillments_attention', ['attentionId'])
@Check('chk_fulfillments_type', inValues('type', Object.values(FulfillmentType)))
@Check(
  'chk_fulfillments_status',
  inValues('status', Object.values(FulfillmentStatus)),
)
@Check('chk_fulfillments_fee', 'delivery_fee >= 0')
@Check(
  'chk_fulfillments_delivery_data',
  `type <> '${FulfillmentType.DELIVERY}' OR delivery_address IS NOT NULL`,
)
@Check(
  'chk_fulfillments_latitude',
  'latitude IS NULL OR latitude BETWEEN -90 AND 90',
)
@Check(
  'chk_fulfillments_longitude',
  'longitude IS NULL OR longitude BETWEEN -180 AND 180',
)
export class FulfillmentOrmEntity extends BaseOrmEntity {
  @Column({ name: 'attention_id', type: 'uuid' })
  attentionId: string;

  @OneToOne('AttentionOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attention_id' })
  attention?: AttentionOrmEntity;

  @Column({ type: 'varchar', length: 20 })
  type: FulfillmentType;

  @Column({ type: 'varchar', length: 30, default: FulfillmentStatus.PENDING })
  status: FulfillmentStatus;

  @Column({ name: 'customer_name', type: 'varchar', length: 150 })
  customerName: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 30 })
  customerPhone: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'estimated_ready_at', type: 'timestamptz', nullable: true })
  estimatedReadyAt: Date | null;

  @Column({
    name: 'delivery_address',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  deliveryAddress: string | null;

  @Column({
    name: 'delivery_reference',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  deliveryReference: string | null;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer,
  })
  latitude: number | null;

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer,
  })
  longitude: number | null;

  @Column({
    name: 'delivery_fee',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  deliveryFee: number;

  @Column({ name: 'eat_at_restaurant', type: 'boolean', nullable: true })
  eatAtRestaurant: boolean | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;
}
