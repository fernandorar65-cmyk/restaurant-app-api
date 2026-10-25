import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiningTable } from '../../../../domain/entities/dining-table.entity.js';
import { DiningTableRepository } from '../../../../domain/repositories/dining-table.repository.js';
import { DiningTableOrmEntity } from '../entities/dining-table.orm-entity.js';
import { DiningTableMapper } from '../mappers/dining-table.mapper.js';

@Injectable()
export class TypeOrmDiningTableRepository implements DiningTableRepository {
  constructor(
    @InjectRepository(DiningTableOrmEntity)
    private readonly repository: Repository<DiningTableOrmEntity>,
  ) {}

  async findById(id: string): Promise<DiningTable | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? DiningTableMapper.toDomain(found) : null;
  }

  async findAll(): Promise<DiningTable[]> {
    const rows = await this.repository.find();
    return rows.map(DiningTableMapper.toDomain);
  }

  async save(diningTable: DiningTable): Promise<DiningTable> {
    const existing = await this.repository.findOne({
      where: { id: diningTable.id },
    });
    const orm = DiningTableMapper.toPersistence(
      diningTable,
      existing ?? undefined,
    );
    const saved = await this.repository.save(orm);
    return DiningTableMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
