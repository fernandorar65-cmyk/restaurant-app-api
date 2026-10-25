import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantRepository } from '../../../../domain/repositories/restaurant.repository.js';
import { RestaurantOrmEntity } from '../entities/restaurant.orm-entity.js';
import { RestaurantMapper } from '../mappers/restaurant.mapper.js';

@Injectable()
export class TypeOrmRestaurantRepository implements RestaurantRepository {
  constructor(
    @InjectRepository(RestaurantOrmEntity)
    private readonly repository: Repository<RestaurantOrmEntity>,
  ) {}

  async findById(id: string): Promise<Restaurant | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? RestaurantMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Restaurant[]> {
    const rows = await this.repository.find();
    return rows.map(RestaurantMapper.toDomain);
  }

  async save(restaurant: Restaurant): Promise<Restaurant> {
    const existing = await this.repository.findOne({
      where: { id: restaurant.id },
    });
    const orm = RestaurantMapper.toPersistence(restaurant, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return RestaurantMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
