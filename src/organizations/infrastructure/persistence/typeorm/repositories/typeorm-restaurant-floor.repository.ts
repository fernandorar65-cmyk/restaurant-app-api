import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { RestaurantFloor } from '../../../../domain/entities/restaurant-floor.entity.js';
import { RestaurantFloorRepository } from '../../../../domain/repositories/restaurant-floor.repository.js';
import { RestaurantFloorOrmEntity } from '../entities/restaurant-floor.orm-entity.js';
import { RestaurantFloorMapper } from '../mappers/restaurant-floor.mapper.js';

@Injectable()
export class TypeOrmRestaurantFloorRepository
  extends TypeOrmBaseRepository<RestaurantFloor, RestaurantFloorOrmEntity>
  implements RestaurantFloorRepository
{
  constructor(
    @InjectRepository(RestaurantFloorOrmEntity)
    repository: Repository<RestaurantFloorOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: RestaurantFloorOrmEntity): RestaurantFloor {
    return RestaurantFloorMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: RestaurantFloor,
    existing?: RestaurantFloorOrmEntity,
  ): RestaurantFloorOrmEntity {
    return RestaurantFloorMapper.toPersistence(domain, existing);
  }

  override async findAll(
    filter: { restaurantId?: string } = {},
  ): Promise<RestaurantFloor[]> {
    const rows = await this.repository.find({
      where: { restaurantId: filter.restaurantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByName(
    restaurantId: string,
    name: string,
  ): Promise<RestaurantFloor | null> {
    const found = await this.repository.findOne({
      where: { restaurantId, name },
    });
    return found ? this.toDomain(found) : null;
  }
}
