import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantOrderMode } from '../../../../domain/entities/restaurant-order-mode.entity.js';
import { OrderMode } from '../../../../domain/enums/order-mode.enum.js';
import { RestaurantOrderModeRepository } from '../../../../domain/repositories/restaurant-order-mode.repository.js';
import { RestaurantOrderModeOrmEntity } from '../entities/restaurant-order-mode.orm-entity.js';
import { RestaurantOrderModeMapper } from '../mappers/restaurant-order-mode.mapper.js';

@Injectable()
export class TypeOrmRestaurantOrderModeRepository
  implements RestaurantOrderModeRepository
{
  constructor(
    @InjectRepository(RestaurantOrderModeOrmEntity)
    private readonly repository: Repository<RestaurantOrderModeOrmEntity>,
  ) {}

  async find(
    restaurantId: string,
    mode: OrderMode,
  ): Promise<RestaurantOrderMode | null> {
    const found = await this.repository.findOne({ where: { restaurantId, mode } });
    return found ? RestaurantOrderModeMapper.toDomain(found) : null;
  }

  async findByRestaurant(restaurantId: string): Promise<RestaurantOrderMode[]> {
    const rows = await this.repository.find({ where: { restaurantId } });
    return rows.map((row) => RestaurantOrderModeMapper.toDomain(row));
  }

  async save(orderMode: RestaurantOrderMode): Promise<RestaurantOrderMode> {
    const existing = await this.repository.findOne({
      where: { restaurantId: orderMode.restaurantId, mode: orderMode.mode },
    });
    const saved = await this.repository.save(
      RestaurantOrderModeMapper.toPersistence(orderMode, existing ?? undefined),
    );
    return RestaurantOrderModeMapper.toDomain(saved);
  }
}
