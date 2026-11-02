import type {
  Page,
  PageRequest,
} from '../../../common/domain/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { OrderStatus } from '../enums/order-status.enum.js';

export const ORDER_ITEM_REPOSITORY = Symbol('ORDER_ITEM_REPOSITORY');

export interface ItemReportFilter {
  restaurantId: string;
  /** Business dates of the item's order, inclusive, in the restaurant's time zone. */
  from: string;
  to: string;
  timeZone: string;
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

/** Average time items spent between two canonical states. */
export interface StageDuration {
  from: OrderStatus;
  to: OrderStatus;
  averageMinutes: number;
  /** Items that went through both states. */
  items: number;
}

/** Read side of order items (kitchen board, bills); items change through their Order. */
export interface OrderItemRepository {
  findById(id: string, tx?: TransactionContext): Promise<OrderItem | null>;
  findByOrder(orderId: string, tx?: TransactionContext): Promise<OrderItem[]>;
  findByAttention(attentionId: string): Promise<OrderItem[]>;
  /**
   * Kitchen / floor board: items of a restaurant, optionally by status. By
   * default only items of active attentions (OPEN / BILL_REQUESTED).
   */
  findForBoard(
    filter: {
      restaurantId: string;
      statuses?: OrderStatus[];
      includeClosedAttentions?: boolean;
    },
    page: PageRequest,
  ): Promise<Page<OrderItem>>;
  /**
   * Best sellers: billable items (not rejected or cancelled) of attentions
   * that were not cancelled, by quantity.
   */
  productSales(filter: ItemReportFilter, limit: number): Promise<ProductSales[]>;
  /**
   * Waiting (SUBMITTED → IN_PREPARATION), preparation (→ READY), delivery
   * (→ SERVED) and the whole trip (SUBMITTED → SERVED), measured from the
   * first time each item reached each canonical state.
   */
  stageDurations(filter: ItemReportFilter): Promise<StageDuration[]>;
}
