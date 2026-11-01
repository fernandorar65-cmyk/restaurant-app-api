import {
  Check,
  Column,
  Entity,
  ForeignKey,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/infrastructure/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/infrastructure/persistence/column-options.js';
import type { SupplyOrmEntity } from './supply.orm-entity.js';

// Stock and settings of a master supply in one restaurant. current_quantity
// only changes together with an inventory_movements row, in one transaction.
@Entity('restaurant_supplies')
@Unique('uq_restaurant_supplies_restaurant_supply', [
  'restaurantId',
  'supplyId',
])
@Index('idx_restaurant_supplies_supply', ['supplyId'])
@Check('chk_restaurant_supplies_current', 'current_quantity >= 0')
@Check('chk_restaurant_supplies_minimum', 'minimum_quantity >= 0')
@Check('chk_restaurant_supplies_average_cost', 'average_unit_cost >= 0')
export class RestaurantSupplyOrmEntity extends BaseOrmEntity {
  @ForeignKey('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @Column({ name: 'supply_id', type: 'uuid' })
  supplyId: string;

  @ManyToOne('SupplyOrmEntity')
  @JoinColumn({ name: 'supply_id' })
  supply?: SupplyOrmEntity;

  @Column({
    name: 'current_quantity',
    type: 'numeric',
    precision: 14,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  currentQuantity: number;

  @Column({
    name: 'minimum_quantity',
    type: 'numeric',
    precision: 14,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  minimumQuantity: number;

  @Column({
    name: 'average_unit_cost',
    type: 'numeric',
    precision: 14,
    scale: 4,
    default: 0,
    transformer: decimalTransformer,
  })
  averageUnitCost: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
