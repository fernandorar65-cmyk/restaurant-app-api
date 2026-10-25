import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { RestaurantOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/restaurant.orm-entity.js';
import type { InventoryCategoryOrmEntity } from './inventory-category.orm-entity.js';

// current_quantity must only change together with an inventory_movements row
// in the same transaction.
@Entity('supplies')
@Unique('uq_supplies_restaurant_code', ['restaurantId', 'code'])
@Index('idx_supplies_restaurant_category', ['restaurantId', 'categoryId'])
@Check('chk_supplies_minimum', 'minimum_quantity >= 0')
@Check('chk_supplies_current', 'current_quantity >= 0')
@Check('chk_supplies_average_cost', 'average_unit_cost >= 0')
export class SupplyOrmEntity extends BaseOrmEntity {
  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId: string;

  @ManyToOne('RestaurantOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantOrmEntity;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne('InventoryCategoryOrmEntity')
  @JoinColumn({ name: 'category_id' })
  category?: InventoryCategoryOrmEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'unit_of_measure', type: 'varchar', length: 30 })
  unitOfMeasure: string;

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
    name: 'current_quantity',
    type: 'numeric',
    precision: 14,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  currentQuantity: number;

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
