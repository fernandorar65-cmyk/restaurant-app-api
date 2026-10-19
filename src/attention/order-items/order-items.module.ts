import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../../organizations/products/products.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderItemsController } from './order-items.controller.js';
import { OrderItemsService } from './order-items.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem]), OrdersModule, ProductsModule],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
