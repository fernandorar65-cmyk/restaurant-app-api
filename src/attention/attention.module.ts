import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsContextModule } from '../organizations/organizations.module.js';
import { OrderItemsService } from './application/order-items/order-items.service.js';
import { OrderStatusHistoryService } from './application/order-status-history/order-status-history.service.js';
import { OrdersService } from './application/orders/orders.service.js';
import { DINING_TABLE_LOOKUP } from './application/ports/dining-table-lookup.port.js';
import { PRODUCT_LOOKUP } from './application/ports/product-lookup.port.js';
import { ORDER_ITEM_REPOSITORY } from './domain/repositories/order-item.repository.js';
import { ORDER_STATUS_HISTORY_REPOSITORY } from './domain/repositories/order-status-history.repository.js';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.js';
import { OrderItemOrmEntity } from './infrastructure/persistence/typeorm/entities/order-item.orm-entity.js';
import { OrderStatusHistoryOrmEntity } from './infrastructure/persistence/typeorm/entities/order-status-history.orm-entity.js';
import { OrderOrmEntity } from './infrastructure/persistence/typeorm/entities/order.orm-entity.js';
import { TypeOrmOrderItemRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order-item.repository.js';
import { TypeOrmOrderStatusHistoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order-status-history.repository.js';
import { TypeOrmOrderRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order.repository.js';
import { InternalDiningTableLookupAdapter } from './infrastructure/lookups/internal-dining-table-lookup.adapter.js';
import { InternalProductLookupAdapter } from './infrastructure/lookups/internal-product-lookup.adapter.js';
import { OrderItemsController } from './infrastructure/http/controllers/order-items.controller.js';
import { OrderStatusHistoryController } from './infrastructure/http/controllers/order-status-history.controller.js';
import { OrdersController } from './infrastructure/http/controllers/orders.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderOrmEntity,
      OrderItemOrmEntity,
      OrderStatusHistoryOrmEntity,
    ]),
    OrganizationsContextModule,
  ],
  controllers: [
    OrdersController,
    OrderItemsController,
    OrderStatusHistoryController,
  ],
  providers: [
    OrdersService,
    OrderItemsService,
    OrderStatusHistoryService,
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
    { provide: ORDER_ITEM_REPOSITORY, useClass: TypeOrmOrderItemRepository },
    {
      provide: ORDER_STATUS_HISTORY_REPOSITORY,
      useClass: TypeOrmOrderStatusHistoryRepository,
    },
    { provide: DINING_TABLE_LOOKUP, useClass: InternalDiningTableLookupAdapter },
    { provide: PRODUCT_LOOKUP, useClass: InternalProductLookupAdapter },
  ],
})
export class AttentionModule {}
