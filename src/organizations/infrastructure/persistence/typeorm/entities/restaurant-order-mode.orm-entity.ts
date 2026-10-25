import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { OrderMode } from '../../../../domain/enums/order-mode.enum.js';
import type { RestaurantOrmEntity } from './restaurant.orm-entity.js';

@Entity('restaurant_order_modes')
@Check('chk_order_modes_mode', inValues('mode', Object.values(OrderMode)))
@Check(
  'chk_order_modes_minimum',
  'minimum_amount IS NULL OR minimum_amount >= 0',
)
@Check('chk_order_modes_fee', 'delivery_fee IS NULL OR delivery_fee >= 0')
export class RestaurantOrderModeOrmEntity {
  @PrimaryColumn({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @PrimaryColumn({ type: 'varchar', length: 20 })
  mode: OrderMode;

  @ManyToOne('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({
    name: 'minimum_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  minimumAmount: number | null;

  @Column({
    name: 'delivery_fee',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  deliveryFee: number | null;

  @Column({
    name: 'configuration_json',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  configurationJson: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
