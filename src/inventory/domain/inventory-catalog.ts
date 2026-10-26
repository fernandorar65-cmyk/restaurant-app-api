import { MovementEffect } from './enums/movement-effect.enum.js';
import { MovementTypeCode } from './enums/movement-type-code.enum.js';
import { UnitDimension } from './enums/unit-dimension.enum.js';

export interface UnitDefinition {
  code: string;
  name: string;
  dimension: UnitDimension;
  /** Factor to the base unit of its dimension (KG, L, UNIT). */
  conversionFactorToBase: number;
}

export interface MovementTypeDefinition {
  code: MovementTypeCode;
  name: string;
  effect: MovementEffect;
}

/**
 * Platform-wide catalogs maintained by ACMR. Codes and effects are owned by
 * the code: administrators can only rename (and enable/disable units), so
 * the catalog never changes how a balance is computed.
 */
export const UNITS_OF_MEASURE: UnitDefinition[] = [
  { code: 'KG', name: 'Kilogramo', dimension: UnitDimension.MASS, conversionFactorToBase: 1 },
  { code: 'G', name: 'Gramo', dimension: UnitDimension.MASS, conversionFactorToBase: 0.001 },
  { code: 'L', name: 'Litro', dimension: UnitDimension.VOLUME, conversionFactorToBase: 1 },
  { code: 'ML', name: 'Mililitro', dimension: UnitDimension.VOLUME, conversionFactorToBase: 0.001 },
  { code: 'UNIT', name: 'Unidad', dimension: UnitDimension.UNIT, conversionFactorToBase: 1 },
];

export const MOVEMENT_TYPES: MovementTypeDefinition[] = [
  { code: MovementTypeCode.PURCHASE, name: 'Compra', effect: MovementEffect.INCREASE },
  { code: MovementTypeCode.USAGE, name: 'Consumo', effect: MovementEffect.DECREASE },
  { code: MovementTypeCode.WASTE, name: 'Merma', effect: MovementEffect.DECREASE },
  {
    code: MovementTypeCode.COUNT_ADJUSTMENT_IN,
    name: 'Ajuste por conteo (entrada)',
    effect: MovementEffect.INCREASE,
  },
  {
    code: MovementTypeCode.COUNT_ADJUSTMENT_OUT,
    name: 'Ajuste por conteo (salida)',
    effect: MovementEffect.DECREASE,
  },
  {
    code: MovementTypeCode.MANUAL_ADJUSTMENT_IN,
    name: 'Ajuste manual (entrada)',
    effect: MovementEffect.INCREASE,
  },
  {
    code: MovementTypeCode.MANUAL_ADJUSTMENT_OUT,
    name: 'Ajuste manual (salida)',
    effect: MovementEffect.DECREASE,
  },
  { code: MovementTypeCode.REVERSAL, name: 'Reversión', effect: MovementEffect.CALCULATED },
];

const EFFECTS = new Map(MOVEMENT_TYPES.map((type) => [type.code, type.effect]));

export function movementEffect(code: MovementTypeCode): MovementEffect {
  return EFFECTS.get(code) as MovementEffect;
}
