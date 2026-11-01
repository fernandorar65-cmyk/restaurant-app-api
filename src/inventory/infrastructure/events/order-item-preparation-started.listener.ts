import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderItemPreparationStarted } from '../../../attention/public-api.js';
import { EVENT_BUS } from '../../../common/application/ports/event-bus.port.js';
import type { EventBus } from '../../../common/application/ports/event-bus.port.js';
import { StockConsumptionService } from '../../application/stock-consumption/stock-consumption.service.js';

/**
 * Discounts the recipe of a dish when the kitchen starts preparing it. A
 * stock problem must never block the kitchen flow, so failures are logged,
 * not thrown back to attention.
 */
@Injectable()
export class OrderItemPreparationStartedListener implements OnModuleInit {
  private readonly logger = new Logger(
    OrderItemPreparationStartedListener.name,
  );

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    private readonly stockConsumption: StockConsumptionService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe(OrderItemPreparationStarted, (event) =>
      this.consume(event),
    );
  }

  private async consume(event: OrderItemPreparationStarted): Promise<void> {
    try {
      await this.stockConsumption.consumeForProduct({
        productId: event.productId,
        units: event.quantity,
        originModule: 'ATTENTION',
        originId: event.orderItemId,
        createdByUserId: event.changedByUserId,
      });
    } catch (error) {
      this.logger.error(
        `Could not discount stock for order item ${event.orderItemId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
