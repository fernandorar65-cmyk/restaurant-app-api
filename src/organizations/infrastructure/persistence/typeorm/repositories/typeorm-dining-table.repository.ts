import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { DiningTable } from '../../../../domain/entities/dining-table.entity.js';
import { DiningTableRepository } from '../../../../domain/repositories/dining-table.repository.js';
import { DiningTableOrmEntity } from '../entities/dining-table.orm-entity.js';
import { DiningTableMapper } from '../mappers/dining-table.mapper.js';

@Injectable()
export class TypeOrmDiningTableRepository
  extends TypeOrmBaseRepository<DiningTable, DiningTableOrmEntity>
  implements DiningTableRepository
{
  constructor(
    @InjectRepository(DiningTableOrmEntity)
    repository: Repository<DiningTableOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: DiningTableOrmEntity): DiningTable {
    return DiningTableMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: DiningTable,
    existing?: DiningTableOrmEntity,
  ): DiningTableOrmEntity {
    return DiningTableMapper.toPersistence(domain, existing);
  }

  override async findAll(
    filter: { restaurantId?: string; floorId?: string } = {},
  ): Promise<DiningTable[]> {
    const rows = await this.repository.find({
      where: { restaurantId: filter.restaurantId, floorId: filter.floorId },
      order: { code: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByCode(
    restaurantId: string,
    code: string,
  ): Promise<DiningTable | null> {
    const found = await this.repository.findOne({
      where: { restaurantId, code },
    });
    return found ? this.toDomain(found) : null;
  }
}
