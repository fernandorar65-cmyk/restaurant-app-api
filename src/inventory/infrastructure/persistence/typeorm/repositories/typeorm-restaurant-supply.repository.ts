import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { RestaurantSupply } from '../../../../domain/entities/restaurant-supply.entity.js';
import type {
  RestaurantSupplyFilter,
  RestaurantSupplyRepository,
} from '../../../../domain/repositories/restaurant-supply.repository.js';
import { RestaurantSupplyOrmEntity } from '../entities/restaurant-supply.orm-entity.js';
import { RestaurantSupplyMapper } from '../mappers/inventory.mappers.js';

@Injectable()
export class TypeOrmRestaurantSupplyRepository
  extends TypeOrmBaseRepository<RestaurantSupply, RestaurantSupplyOrmEntity>
  implements RestaurantSupplyRepository
{
  constructor(
    @InjectRepository(RestaurantSupplyOrmEntity)
    repository: Repository<RestaurantSupplyOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: RestaurantSupplyOrmEntity): RestaurantSupply {
    return RestaurantSupplyMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: RestaurantSupply,
    existing?: RestaurantSupplyOrmEntity,
  ): RestaurantSupplyOrmEntity {
    return RestaurantSupplyMapper.toPersistence(domain, existing);
  }

  async findByIdForUpdate(id: string, tx: TransactionContext): Promise<RestaurantSupply | null> {
    const found = await this.getRepository(tx).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    return found ? this.toDomain(found) : null;
  }

  async findForUpdate(
    restaurantId: string,
    supplyId: string,
    tx: TransactionContext,
  ): Promise<RestaurantSupply | null> {
    const found = await this.getRepository(tx).findOne({
      where: { restaurantId, supplyId },
      lock: { mode: 'pessimistic_write' },
    });
    return found ? this.toDomain(found) : null;
  }

  async find(restaurantId: string, supplyId: string): Promise<RestaurantSupply | null> {
    const found = await this.repository.findOne({ where: { restaurantId, supplyId } });
    return found ? this.toDomain(found) : null;
  }

  async findPage(
    filter: RestaurantSupplyFilter,
    page: PageRequest,
  ): Promise<Page<RestaurantSupply>> {
    const query = this.repository
      .createQueryBuilder('rs')
      .orderBy('rs.created_at', 'ASC')
      .skip((page.page - 1) * page.limit)
      .take(page.limit);
    if (filter.restaurantId) {
      query.andWhere('rs.restaurant_id = :restaurantId', { restaurantId: filter.restaurantId });
    }
    if (filter.supplyId) {
      query.andWhere('rs.supply_id = :supplyId', { supplyId: filter.supplyId });
    }
    if (filter.isActive !== undefined) {
      query.andWhere('rs.is_active = :isActive', { isActive: filter.isActive });
    }
    if (filter.lowStock !== undefined) {
      const low = 'rs.minimum_quantity > 0 AND rs.current_quantity <= rs.minimum_quantity';
      query.andWhere(filter.lowStock ? `(${low})` : `NOT (${low})`);
    }
    const [rows, total] = await query.getManyAndCount();
    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }
}
