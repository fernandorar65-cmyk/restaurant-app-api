import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsModule } from '../restaurants/restaurants.module.js';
import { DiningTablesController } from './dining-tables.controller.js';
import { DiningTablesService } from './dining-tables.service.js';
import { DiningTable } from './entities/dining-table.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DiningTable]), RestaurantsModule],
  controllers: [DiningTablesController],
  providers: [DiningTablesService],
  exports: [DiningTablesService],
})
export class DiningTablesModule {}
