import { Module } from '@nestjs/common';
import { OrderItemsModule } from './order-items/order-items.module.js';
import { OrderStatusHistoryModule } from './order-status-history/order-status-history.module.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [OrdersModule, OrderItemsModule, OrderStatusHistoryModule],
})
export class AttentionModule {}
