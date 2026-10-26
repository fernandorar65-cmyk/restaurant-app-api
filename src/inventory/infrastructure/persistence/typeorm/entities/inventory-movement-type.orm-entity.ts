import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { MovementEffect } from '../../../../domain/enums/movement-effect.enum.js';

/** Platform-wide catalog maintained by ACMR; the effect decides the balance. */
@Entity('inventory_movement_types')
@Unique('uq_inventory_movement_types_code', ['code'])
@Check('chk_inventory_movement_types_code', "code ~ '^[A-Z][A-Z_]*$'")
@Check('chk_inventory_movement_types_effect', inValues('effect', Object.values(MovementEffect)))
export class InventoryMovementTypeOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  effect: MovementEffect;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
