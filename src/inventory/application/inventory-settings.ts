export const INVENTORY_SETTINGS = Symbol('INVENTORY_SETTINGS');

/** Switches of the inventory context, resolved from the environment at startup. */
export interface InventorySettings {
  /** Discount recipes from stock when the kitchen starts a dish (INVENTORY_AUTO_CONSUMPTION). */
  autoConsumption: boolean;
}
