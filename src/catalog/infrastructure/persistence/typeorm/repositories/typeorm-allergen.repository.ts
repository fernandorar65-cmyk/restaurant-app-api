import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Allergen } from '../../../../domain/entities/allergen.entity.js';
import { AllergenRepository } from '../../../../domain/repositories/allergen.repository.js';
import { AllergenOrmEntity } from '../entities/allergen.orm-entity.js';
import { AllergenMapper } from '../mappers/composition.mappers.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

@Injectable()
export class TypeOrmAllergenRepository
  extends TypeOrmBaseRepository<Allergen, AllergenOrmEntity>
  implements AllergenRepository
{
  constructor(
    @InjectRepository(AllergenOrmEntity)
    repository: Repository<AllergenOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: AllergenOrmEntity): Allergen {
    return AllergenMapper.toDomain(orm);
  }

  protected toPersistence(domain: Allergen, existing?: AllergenOrmEntity): AllergenOrmEntity {
    return AllergenMapper.toPersistence(domain, existing);
  }

  async findPage(page: PageRequest): Promise<Page<Allergen>> {
    return this.findPageBy({ order: { name: 'ASC' } }, page);
  }

  async findByCode(code: string): Promise<Allergen | null> {
    const found = await this.repository.findOne({ where: { code } });
    return found ? this.toDomain(found) : null;
  }

  async findByIds(ids: string[]): Promise<Allergen[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.repository.find({
      where: { id: In(ids) },
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }
}
