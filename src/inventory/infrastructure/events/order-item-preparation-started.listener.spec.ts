import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrderItemPreparationStarted } from '../../../attention/public-api.js';
import { InProcessEventBus } from '../../../common/infrastructure/events/in-process-event-bus.js';
import type { StockConsumptionService } from '../../application/stock-consumption/stock-consumption.service.js';
import { OrderItemPreparationStartedListener } from './order-item-preparation-started.listener.js';

function setup(
  consumeForProduct: StockConsumptionService['consumeForProduct'],
) {
  const bus = new InProcessEventBus();
  const stock = { consumeForProduct: vi.fn(consumeForProduct) };
  new OrderItemPreparationStartedListener(
    bus,
    stock as unknown as StockConsumptionService,
  ).onModuleInit();
  return { bus, stock };
}

const event = new OrderItemPreparationStarted(
  'item-1',
  'product-1',
  3,
  'user-1',
);

describe('OrderItemPreparationStartedListener', () => {
  it('discounts the recipe of the item, keyed by the order item', async () => {
    const { bus, stock } = setup(async () => []);

    await bus.publish(event);

    expect(stock.consumeForProduct).toHaveBeenCalledWith({
      productId: 'product-1',
      units: 3,
      originModule: 'ATTENTION',
      originId: 'item-1',
      createdByUserId: 'user-1',
    });
  });

  it('logs a stock failure instead of failing the kitchen flow', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const { bus } = setup(async () => {
      throw new Error('no stock');
    });

    await expect(bus.publish(event)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      'Could not discount stock for order item item-1',
      expect.stringContaining('no stock'),
    );
    log.mockRestore();
  });
});
