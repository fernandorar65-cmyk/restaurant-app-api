import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsModule } from '../restaurants/restaurants.module.js';
import { KitchenSupply } from './entities/kitchen-supply.entity.js';
import { KitchenSuppliesController } from './kitchen-supplies.controller.js';
import { KitchenSuppliesService } from './kitchen-supplies.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([KitchenSupply]), RestaurantsModule],
  controllers: [KitchenSuppliesController],
  providers: [KitchenSuppliesService],
  exports: [KitchenSuppliesService],
})
export class KitchenSuppliesModule {}
