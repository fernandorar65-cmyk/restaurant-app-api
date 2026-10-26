import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import {
  decimalTransformer,
  inValues,
} from '../../../../../common/persistence/column-options.js';
import { UnitDimension } from '../../../../domain/enums/unit-dimension.enum.js';

/** Platform-wide catalog maintained by ACMR: no free-text units ("kg", "kilo"...). */
@Entity('units_of_measure')
@Unique('uq_units_of_measure_code', ['code'])
@Check('chk_units_of_measure_code', "code ~ '^[A-Z][A-Z_]*$'")
@Check('chk_units_of_measure_dimension', inValues('dimension', Object.values(UnitDimension)))
@Check('chk_units_of_measure_factor', 'conversion_factor_to_base > 0')
export class UnitOfMeasureOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  dimension: UnitDimension;

  // Factor to the base unit of its dimension; conversions are not used yet.
  @Column({
    name: 'conversion_factor_to_base',
    type: 'numeric',
    precision: 18,
    scale: 6,
    transformer: decimalTransformer,
  })
  conversionFactorToBase: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
