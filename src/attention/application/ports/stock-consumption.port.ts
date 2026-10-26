export const STOCK_CONSUMPTION = Symbol('STOCK_CONSUMPTION');

/**
 * Asks inventory to discount the supplies used to prepare an order item
 * (according to the product recipe). Attention doesn't know about stock;
 * it only reports that the kitchen started preparing the dish.
 */
export interface StockConsumptionPort {
  consumeForOrderItem(input: {
    orderItemId: string;
    productId: string;
    quantity: number;
    changedByUserId?: string | null;
  }): Promise<void>;
}
