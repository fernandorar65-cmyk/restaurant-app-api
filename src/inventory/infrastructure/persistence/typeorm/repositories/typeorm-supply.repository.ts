import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { withoutUndefined } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Supply } from '../../../../domain/entities/supply.entity.js';
import { SupplyRepository } from '../../../../domain/repositories/supply.repository.js';
import { SupplyOrmEntity } from '../entities/supply.orm-entity.js';
import { UnitOfMeasureOrmEntity } from '../entities/unit-of-measure.orm-entity.js';
import { SupplyMapper } from '../mappers/inventory.mappers.js';

@Injectable()
export class TypeOrmSupplyRepository implements SupplyRepository {
  constructor(
    @InjectRepository(SupplyOrmEntity)
    private readonly repository: Repository<SupplyOrmEntity>,
    @InjectRepository(UnitOfMeasureOrmEntity)
    private readonly units: Repository<UnitOfMeasureOrmEntity>,
  ) {}

  async findById(id: string): Promise<Supply | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? SupplyMapper.toDomain(found) : null;
  }

  async findByIds(ids: string[]): Promise<Supply[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.repository.find({ where: { id: In(ids) } });
    return rows.map((row) => SupplyMapper.toDomain(row));
  }

  async findByCode(organizationId: string, code: string): Promise<Supply | null> {
    const found = await this.repository.findOne({ where: { organizationId, code } });
    return found ? SupplyMapper.toDomain(found) : null;
  }

  async findPage(
    filter: { organizationId?: string; categoryId?: string; isActive?: boolean },
    page: PageRequest,
  ): Promise<Page<Supply>> {
    const [rows, total] = await this.repository.findAndCount({
      where: withoutUndefined(filter),
      order: { name: 'ASC' },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return {
      items: rows.map((row) => SupplyMapper.toDomain(row)),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async save(supply: Supply): Promise<Supply> {
    const unit = await this.units.findOneOrFail({ where: { code: supply.unitCode } });
    const existing = await this.repository.findOne({ where: { id: supply.id } });
    await this.repository.save(SupplyMapper.toPersistence(supply, unit.id, existing ?? undefined));
    return (await this.findById(supply.id)) as Supply;
  }
}
