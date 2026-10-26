/**
 * Stable codes of the inventory_movement_types catalog. Each one has a fixed
 * effect on the stock (see inventory-catalog.ts); there is no ambiguous
 * ADJUSTMENT: every correction says whether it increases or decreases.
 */
export enum MovementTypeCode {
  PURCHASE = 'PURCHASE',
  USAGE = 'USAGE',
  WASTE = 'WASTE',
  COUNT_ADJUSTMENT_IN = 'COUNT_ADJUSTMENT_IN',
  COUNT_ADJUSTMENT_OUT = 'COUNT_ADJUSTMENT_OUT',
  MANUAL_ADJUSTMENT_IN = 'MANUAL_ADJUSTMENT_IN',
  MANUAL_ADJUSTMENT_OUT = 'MANUAL_ADJUSTMENT_OUT',
  REVERSAL = 'REVERSAL',
}

/** Types a person can register directly (counts and reversals have their own flows). */
export const MANUAL_MOVEMENT_TYPES = [
  MovementTypeCode.PURCHASE,
  MovementTypeCode.USAGE,
  MovementTypeCode.WASTE,
  MovementTypeCode.MANUAL_ADJUSTMENT_IN,
  MovementTypeCode.MANUAL_ADJUSTMENT_OUT,
] as const;

export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number];
