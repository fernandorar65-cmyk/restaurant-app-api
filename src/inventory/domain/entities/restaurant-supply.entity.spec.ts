import { MovementTypeCode } from '../enums/movement-type-code.enum.js';
import {
  InsufficientStockError,
  InvalidMovementQuantityError,
  ReversalNotReversibleError,
} from '../exceptions/inventory.errors.js';
import { RestaurantSupply } from './restaurant-supply.entity.js';

let sequence = 0;
const context = () => ({ id: `movement-${++sequence}` });

function riceWith(quantity: number, averageUnitCost = 0): RestaurantSupply {
  const rice = RestaurantSupply.enable({ id: 'rs-1', restaurantId: 'r-1', supplyId: 's-1' });
  if (quantity > 0) {
    rice.register(MovementTypeCode.PURCHASE, quantity, { ...context(), unitCost: averageUnitCost });
  }
  return rice;
}

describe('RestaurantSupply', () => {
  it('keeps the balance and the before/after of each movement (spec example)', () => {
    const rice = riceWith(20, 4);
    const purchase = rice.register(MovementTypeCode.PURCHASE, 10, context());
    const usage = rice.register(MovementTypeCode.USAGE, 3, context());

    expect([purchase.quantityDelta, purchase.previousQuantity, purchase.resultingQuantity]).toEqual([10, 20, 30]);
    expect([usage.quantityDelta, usage.previousQuantity, usage.resultingQuantity]).toEqual([-3, 30, 27]);
    expect(rice.currentQuantity).toBe(27);
  });

  it('tells increases from decreases by the type, never by a sign sent by the client', () => {
    const rice = riceWith(10);
    expect(rice.register(MovementTypeCode.MANUAL_ADJUSTMENT_IN, 2, context()).quantityDelta).toBe(2);
    expect(rice.register(MovementTypeCode.MANUAL_ADJUSTMENT_OUT, 5, context()).quantityDelta).toBe(-5);
    expect(rice.register(MovementTypeCode.WASTE, 1, context()).quantityDelta).toBe(-1);
    expect(() => rice.register(MovementTypeCode.USAGE, -1, context())).toThrow(
      InvalidMovementQuantityError,
    );
  });

  it('never leaves the stock negative', () => {
    const rice = riceWith(2);
    expect(() => rice.register(MovementTypeCode.USAGE, 2.001, context())).toThrow(
      InsufficientStockError,
    );
    expect(rice.currentQuantity).toBe(2);
  });

  it('records a count as the computed difference plus what was counted', () => {
    const rice = riceWith(20);
    const out = rice.count(18, context());
    expect(out?.type).toBe(MovementTypeCode.COUNT_ADJUSTMENT_OUT);
    expect([out?.quantityDelta, out?.countedQuantity, out?.resultingQuantity]).toEqual([-2, 18, 18]);
    const back = rice.count(19.5, context());
    expect([back?.type, back?.quantityDelta]).toEqual([MovementTypeCode.COUNT_ADJUSTMENT_IN, 1.5]);
    expect(rice.count(19.5, context())).toBeNull();
  });

  it('updates the weighted average cost only on purchases', () => {
    const rice = riceWith(10, 4);
    rice.register(MovementTypeCode.PURCHASE, 10, { ...context(), unitCost: 5 });
    expect(rice.averageUnitCost).toBe(4.5);
    rice.register(MovementTypeCode.USAGE, 15, context());
    expect(rice.averageUnitCost).toBe(4.5);
  });

  it('corrects a movement with an opposite reversal', () => {
    const rice = riceWith(5);
    const wrong = rice.register(MovementTypeCode.PURCHASE, 7, context());
    const reversal = rice.reverse(wrong, context());
    expect([reversal.type, reversal.quantityDelta, reversal.reversalOfMovementId]).toEqual([
      MovementTypeCode.REVERSAL,
      -7,
      wrong.id,
    ]);
    expect(rice.currentQuantity).toBe(5);
    expect(() => rice.reverse(reversal, context())).toThrow(ReversalNotReversibleError);
  });

  it('consumes what is left automatically and raises the low stock alert', () => {
    const rice = riceWith(1);
    rice.configure({ minimumQuantity: 2 });
    expect(rice.isLowStock).toBe(true);
    const usage = rice.consumeAvailable(3, context());
    expect([usage?.quantityDelta, rice.currentQuantity]).toEqual([-1, 0]);
    expect(rice.consumeAvailable(3, context())).toBeNull();
  });
});
