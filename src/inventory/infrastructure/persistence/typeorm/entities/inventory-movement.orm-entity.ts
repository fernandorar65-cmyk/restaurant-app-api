import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { InventoryMovementType } from '../../../../domain/enums/inventory-movement-type.enum.js';
import type { UserOrmEntity } from '../../../../../iam/infrastructure/persistence/typeorm/entities/user.orm-entity.js';
import type { SupplyOrmEntity } from './supply.orm-entity.js';

@Entity('inventory_movements')
@Index('idx_inventory_movements_supply_created', ['supplyId', 'createdAt'])
@Check(
  'chk_inventory_movements_type',
  inValues('movement_type', Object.values(InventoryMovementType)),
)
@Check('chk_inventory_movements_quantity', 'quantity > 0')
@Check(
  'chk_inventory_movements_unit_cost',
  'unit_cost IS NULL OR unit_cost >= 0',
)
@Check(
  'chk_inventory_movements_balances',
  'previous_quantity >= 0 AND resulting_quantity >= 0',
)
export class InventoryMovementOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ name: 'supply_id', type: 'uuid' })
  supplyId: string;

  @ManyToOne('SupplyOrmEntity')
  @JoinColumn({ name: 'supply_id' })
  supply?: SupplyOrmEntity;

  @Column({ name: 'movement_type', type: 'varchar', length: 20 })
  movementType: InventoryMovementType;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({
    name: 'unit_cost',
    type: 'numeric',
    precision: 14,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  unitCost: number | null;

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
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne('UserOrmEntity')
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: UserOrmEntity;
}
