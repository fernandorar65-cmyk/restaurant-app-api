import { describe, expect, it } from 'vitest';
import { ServiceType } from '../entities/service-type.entity.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { Fulfillment } from '../entities/fulfillment.entity.js';
import { AttentionStatus } from '../enums/attention-status.enum.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import { FulfillmentType } from '../enums/fulfillment-type.enum.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import {
  InvalidServiceSetupError,
  ProductNotOrderableError,
} from '../exceptions/attention.errors.js';
import type { StatusRef } from '../workflows.js';
import { planAttentionOpening } from './attention-opening.js';
import { computeBill } from './bill.js';
import { requireOrderableProducts } from './orderable-products.js';

const submitted: StatusRef<OrderStatus> = {
  id: 'order-submitted',
  canonicalState: OrderStatus.SUBMITTED,
};
const cancelled: StatusRef<OrderStatus> = {
  id: 'order-cancelled',
  canonicalState: OrderStatus.CANCELLED,
};
const open: StatusRef<AttentionStatus> = {
  id: 'attention-open',
  canonicalState: AttentionStatus.OPEN,
};

function item(id: string, unitPrice: number, quantity: number): OrderItem {
  return OrderItem.create({
    id,
    historyId: `h-${id}`,
    status: submitted,
    orderId: 'o1',
    productId: `p-${id}`,
    productName: `Producto ${id}`,
    unitPrice,
    quantity,
  }).item;
}

function serviceType(
  fulfillmentMode: FulfillmentMode,
  settings: { requiresCustomerAddress?: boolean; deliveryFee?: number } = {},
): ServiceType {
  return ServiceType.create({
    id: `st-${fulfillmentMode}`,
    restaurantId: 'r1',
    code: fulfillmentMode,
    name: fulfillmentMode,
    fulfillmentMode,
    sortOrder: 1,
    ...settings,
  });
}

const contact = { customerName: 'Ana', customerPhone: '999888777' };

describe('computeBill', () => {
  it('charges billable items plus the delivery fee, minus what was paid', () => {
    const dropped = item('b', 5, 1);
    dropped.changeStatus(cancelled, { historyId: 'h-cancel' });
    const fulfillment = Fulfillment.create({
      ...contact,
      id: 'f1',
      attentionId: 'a1',
      type: FulfillmentType.DELIVERY,
      deliveryAddress: 'Av. Siempre Viva 123',
      deliveryFee: 4.5,
    });

    const bill = computeBill({
      items: [item('a', 10.1, 3), dropped],
      fulfillment,
      paid: 20,
    });

    expect(bill.items.map((line) => line.id)).toEqual(['a']);
    expect(bill.subtotal).toBe(30.3);
    expect(bill.deliveryFee).toBe(4.5);
    expect(bill.fulfillmentId).toBe('f1');
    expect(bill.total).toBe(34.8);
    expect(bill.balance).toBe(14.8);
  });

  it('has no delivery fee without pickup/delivery', () => {
    const bill = computeBill({ items: [], fulfillment: null, paid: 0 });
    expect(bill).toMatchObject({
      subtotal: 0,
      deliveryFee: 0,
      fulfillmentId: null,
      total: 0,
      balance: 0,
    });
  });
});

describe('planAttentionOpening', () => {
  const base = {
    attentionId: 'a1',
    fulfillmentId: 'f1',
    attentionNumber: 'A-1',
    status: open,
  };

  it('opens a dine-in attention at a table of the same restaurant, without fulfillment', () => {
    const opening = planAttentionOpening({
      ...base,
      serviceType: serviceType(FulfillmentMode.DINE_IN),
      table: { id: 't1', restaurantId: 'r1' },
    });

    expect(opening.attention.diningTableId).toBe('t1');
    expect(opening.attention.restaurantId).toBe('r1');
    expect(opening.fulfillment).toBeNull();
  });

  it('rejects a table of another restaurant', () => {
    expect(() =>
      planAttentionOpening({
        ...base,
        serviceType: serviceType(FulfillmentMode.DINE_IN),
        table: { id: 't1', restaurantId: 'r2' },
      }),
    ).toThrow(InvalidServiceSetupError);
  });

  it('requires contact data for pickup and creates a PICKUP fulfillment', () => {
    const pickup = serviceType(FulfillmentMode.PICKUP);
    expect(() =>
      planAttentionOpening({ ...base, serviceType: pickup, table: null }),
    ).toThrow(InvalidServiceSetupError);

    const opening = planAttentionOpening({
      ...base,
      serviceType: pickup,
      table: null,
      fulfillment: contact,
    });
    expect(opening.fulfillment?.type).toBe(FulfillmentType.PICKUP);
  });

  it("requires the address when the type asks for it and charges the restaurant's fee", () => {
    const delivery = serviceType(FulfillmentMode.DELIVERY, {
      requiresCustomerAddress: true,
      deliveryFee: 7,
    });
    expect(() =>
      planAttentionOpening({
        ...base,
        serviceType: delivery,
        table: null,
        fulfillment: { ...contact, deliveryAddress: '  ' },
      }),
    ).toThrow(InvalidServiceSetupError);

    const opening = planAttentionOpening({
      ...base,
      serviceType: delivery,
      table: null,
      fulfillment: { ...contact, deliveryAddress: 'Jr. Lima 456' },
    });
    expect(opening.fulfillment?.type).toBe(FulfillmentType.DELIVERY);
    expect(opening.fulfillment?.deliveryFee).toBe(7);
  });
});

describe('requireOrderableProducts', () => {
  const product = (
    id: string,
    restaurantId = 'r1',
    issue: string | null = null,
  ) => ({
    id,
    restaurantId,
    name: id,
    price: 10,
    issue,
  });

  it('returns the products by id when every line can be ordered', () => {
    const byId = requireOrderableProducts(
      'r1',
      ['p1', 'p2'],
      [product('p1'), product('p2')],
    );
    expect([...byId.keys()]).toEqual(['p1', 'p2']);
  });

  it.each([
    ['missing', [], 'PRODUCT_NOT_FOUND'],
    [
      'of another restaurant',
      [product('p1', 'r2')],
      'PRODUCT_NOT_IN_RESTAURANT',
    ],
    [
      'not orderable now',
      [product('p1', 'r1', 'PRODUCT_INACTIVE')],
      'PRODUCT_INACTIVE',
    ],
  ])('rejects a product %s', (_case, products, reason) => {
    const attempt = () => requireOrderableProducts('r1', ['p1'], products);
    expect(attempt).toThrow(ProductNotOrderableError);
    expect(attempt).toThrow(`"p1" no se puede pedir: ${reason}`);
  });
});
