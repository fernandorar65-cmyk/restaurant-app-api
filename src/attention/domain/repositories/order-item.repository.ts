import type {
  Page,
  PageRequest,
} from '../../../common/domain/pagination.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { OrderStatus } from '../enums/order-status.enum.js';

export const ORDER_ITEM_REPOSITORY = Symbol('ORDER_ITEM_REPOSITORY');

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
}
