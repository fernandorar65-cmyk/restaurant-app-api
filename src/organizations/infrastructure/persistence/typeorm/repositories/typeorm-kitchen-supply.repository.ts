import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KitchenSupply } from '../../../../domain/entities/kitchen-supply.entity.js';
import { KitchenSupplyRepository } from '../../../../domain/repositories/kitchen-supply.repository.js';
import { KitchenSupplyOrmEntity } from '../entities/kitchen-supply.orm-entity.js';
import { KitchenSupplyMapper } from '../mappers/kitchen-supply.mapper.js';

@Injectable()
export class TypeOrmKitchenSupplyRepository implements KitchenSupplyRepository {
  constructor(
    @InjectRepository(KitchenSupplyOrmEntity)
    private readonly repository: Repository<KitchenSupplyOrmEntity>,
  ) {}

  async findById(id: string): Promise<KitchenSupply | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? KitchenSupplyMapper.toDomain(found) : null;
  }

  async findAll(): Promise<KitchenSupply[]> {
    const rows = await this.repository.find();
    return rows.map(KitchenSupplyMapper.toDomain);
  }

  async save(kitchenSupply: KitchenSupply): Promise<KitchenSupply> {
    const existing = await this.repository.findOne({
      where: { id: kitchenSupply.id },
    });
    const orm = KitchenSupplyMapper.toPersistence(
      kitchenSupply,
      existing ?? undefined,
    );
    const saved = await this.repository.save(orm);
    return KitchenSupplyMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
