import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantRepository } from '../../../../domain/repositories/restaurant.repository.js';
import { RestaurantOrmEntity } from '../entities/restaurant.orm-entity.js';
import { RestaurantMapper } from '../mappers/restaurant.mapper.js';

@Injectable()
export class TypeOrmRestaurantRepository
  extends TypeOrmBaseRepository<Restaurant, RestaurantOrmEntity>
  implements RestaurantRepository
{
  constructor(
    @InjectRepository(RestaurantOrmEntity)
    repository: Repository<RestaurantOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: RestaurantOrmEntity): Restaurant {
    return RestaurantMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Restaurant,
    existing?: RestaurantOrmEntity,
  ): RestaurantOrmEntity {
    return RestaurantMapper.toPersistence(domain, existing);
  }

  override async findAll(
    filter: { organizationId?: string } = {},
  ): Promise<Restaurant[]> {
    const rows = await this.repository.find({
      where: { organizationId: filter.organizationId },
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    const found = await this.repository.findOne({ where: { slug } });
    return found ? this.toDomain(found) : null;
  }

  async findByCode(
    organizationId: string,
    code: string,
  ): Promise<Restaurant | null> {
    const found = await this.repository.findOne({
      where: { organizationId, code },
    });
    return found ? this.toDomain(found) : null;
  }
}
