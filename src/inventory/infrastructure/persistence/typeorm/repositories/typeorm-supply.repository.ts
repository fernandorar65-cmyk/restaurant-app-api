import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Supply } from '../../../../domain/entities/supply.entity.js';
import { SupplyRepository } from '../../../../domain/repositories/supply.repository.js';
import { SupplyOrmEntity } from '../entities/supply.orm-entity.js';
import { SupplyMapper } from '../mappers/inventory.mappers.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

@Injectable()
export class TypeOrmSupplyRepository
  extends TypeOrmBaseRepository<Supply, SupplyOrmEntity>
  implements SupplyRepository
{
  constructor(
    @InjectRepository(SupplyOrmEntity)
    repository: Repository<SupplyOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: SupplyOrmEntity): Supply {
    return SupplyMapper.toDomain(orm);
  }

  protected toPersistence(domain: Supply, existing?: SupplyOrmEntity): SupplyOrmEntity {
    return SupplyMapper.toPersistence(domain, existing);
  }

  async findPage(
    filter: { restaurantId?: string; categoryId?: string },
    page: PageRequest,
  ): Promise<Page<Supply>> {
    return this.findPageBy({
      where: { restaurantId: filter.restaurantId, categoryId: filter.categoryId },
      order: { name: 'ASC' },
    }, page);
  }

  async findByIdForUpdate(
    id: string,
    tx: TransactionContext,
  ): Promise<Supply | null> {
    const found = await this.getRepository(tx).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByCode(restaurantId: string, code: string): Promise<Supply | null> {
    const found = await this.repository.findOne({ where: { restaurantId, code } });
    return found ? this.toDomain(found) : null;
  }
}
