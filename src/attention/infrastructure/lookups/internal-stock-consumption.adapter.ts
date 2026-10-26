import { Injectable } from '@nestjs/common';
import { StockConsumptionService } from '../../../inventory/application/stock-consumption/stock-consumption.service.js';
import { StockConsumptionPort } from '../../application/ports/stock-consumption.port.js';

/** In-process adapter over inventory's StockConsumptionService. */
@Injectable()
export class InternalStockConsumptionAdapter implements StockConsumptionPort {
  constructor(private readonly stockConsumption: StockConsumptionService) {}

  async consumeForOrderItem(input: {
    orderItemId: string;
    productId: string;
    quantity: number;
    changedByUserId?: string | null;
  }): Promise<void> {
    await this.stockConsumption.consumeForProduct({
      productId: input.productId,
      units: input.quantity,
      originModule: 'ATTENTION',
      originId: input.orderItemId,
      createdByUserId: input.changedByUserId,
    });
  }
}
