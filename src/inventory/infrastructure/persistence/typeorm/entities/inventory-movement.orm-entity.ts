import { Check, Column, Entity, Generated, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { decimalTransformer } from '../../../../../common/persistence/column-options.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { InventoryMovementTypeOrmEntity } from './inventory-movement-type.orm-entity.js';
import type { RestaurantSupplyOrmEntity } from './restaurant-supply.orm-entity.js';

// Immutable history of a restaurant's stock (insert only: no update or
// delete in the application; errors are corrected with a REVERSAL row).
@Entity('inventory_movements')
@Index('idx_inventory_movements_supply_sequence', ['restaurantSupplyId', 'sequence'])
@Index('idx_inventory_movements_type', ['movementTypeId'])
@Index('idx_inventory_movements_origin', ['originModule', 'originId'])
@Index('uq_inventory_movements_idempotency', ['restaurantSupplyId', 'idempotencyKey'], {
  unique: true,
  where: 'idempotency_key IS NOT NULL',
})
@Index('uq_inventory_movements_reversal', ['reversalOfMovementId'], {
  unique: true,
  where: 'reversal_of_movement_id IS NOT NULL',
})
@Check('chk_inventory_movements_delta', 'quantity_delta <> 0')
@Check(
  'chk_inventory_movements_balance',
  'previous_quantity >= 0 AND resulting_quantity >= 0 AND resulting_quantity = previous_quantity + quantity_delta',
)
@Check('chk_inventory_movements_counted', 'counted_quantity IS NULL OR counted_quantity >= 0')
@Check('chk_inventory_movements_unit_cost', 'unit_cost IS NULL OR unit_cost >= 0')
export class InventoryMovementOrmEntity extends CreatedOnlyOrmEntity {
  // Strict insertion order (timestamps can tie): the last movement of a
  // restaurant supply always holds its current balance.
  @Column({ type: 'bigint', update: false, transformer: { to: (v) => v, from: (v) => Number(v) } })
  @Generated('increment')
  sequence: number;

  @Column({ name: 'restaurant_supply_id', type: 'uuid' })
  restaurantSupplyId: string;

  @ManyToOne('RestaurantSupplyOrmEntity')
  @JoinColumn({ name: 'restaurant_supply_id' })
  restaurantSupply?: RestaurantSupplyOrmEntity;

  @Column({ name: 'movement_type_id', type: 'uuid' })
  movementTypeId: string;

  @ManyToOne('InventoryMovementTypeOrmEntity', { eager: true })
  @JoinColumn({ name: 'movement_type_id' })
  movementType: InventoryMovementTypeOrmEntity;

  // Signed: positive for entries, negative for exits.
  @Column({
    name: 'quantity_delta',
    type: 'numeric',
    precision: 14,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantityDelta: number;

  @Column({
    name: 'previous_quantity',
    type: 'numeric',
    precision: 14,
    scale: 3,
    transformer: decimalTransformer,
  })
  previousQuantity: number;

  @Column({
    name: 'resulting_quantity',
    type: 'numeric',
    precision: 14,
    scale: 3,
    transformer: decimalTransformer,
  })
  resultingQuantity: number;

  @Column({
    name: 'counted_quantity',
    type: 'numeric',
    precision: 14,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  countedQuantity: number | null;

  @Column({
    name: 'unit_cost',
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  unitCost: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'origin_module', type: 'varchar', length: 30, nullable: true })
  originModule: string | null;

  @Column({ name: 'origin_id', type: 'varchar', length: 100, nullable: true })
  originId: string | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 100, nullable: true })
  idempotencyKey: string | null;

  // Who registered it (null for automatic movements).
  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: UserOrmEntity;

  @Column({ name: 'reversal_of_movement_id', type: 'uuid', nullable: true })
  reversalOfMovementId: string | null;

  @ManyToOne('InventoryMovementOrmEntity')
  @JoinColumn({ name: 'reversal_of_movement_id' })
  reversalOf?: InventoryMovementOrmEntity;
}
