import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from '../orders/orders.module.js';
import { OrderStatusHistory } from './entities/order-status-history.entity.js';
import { OrderStatusHistoryController } from './order-status-history.controller.js';
import { OrderStatusHistoryService } from './order-status-history.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStatusHistory]), OrdersModule],
  controllers: [OrderStatusHistoryController],
  providers: [OrderStatusHistoryService],
  exports: [OrderStatusHistoryService],
})
export class OrderStatusHistoryModule {}
