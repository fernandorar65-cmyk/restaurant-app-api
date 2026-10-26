import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { withoutUndefined } from '../../../../../common/persistence/typeorm-base.repository.js';
import type {
  InventoryCatalogRepository,
  MovementType,
  UnitOfMeasure,
} from '../../../../domain/repositories/inventory-catalog.repository.js';
import type {
  MovementTypeDefinition,
  UnitDefinition,
} from '../../../../domain/inventory-catalog.js';
import { InventoryMovementTypeOrmEntity } from '../entities/inventory-movement-type.orm-entity.js';
import { UnitOfMeasureOrmEntity } from '../entities/unit-of-measure.orm-entity.js';

const toUnit = (orm: UnitOfMeasureOrmEntity): UnitOfMeasure => ({
  code: orm.code,
  name: orm.name,
  dimension: orm.dimension,
  conversionFactorToBase: orm.conversionFactorToBase,
  isActive: orm.isActive,
});

const toType = (orm: InventoryMovementTypeOrmEntity): MovementType => ({
  code: orm.code,
  name: orm.name,
  effect: orm.effect,
  isActive: orm.isActive,
});

@Injectable()
export class TypeOrmInventoryCatalogRepository implements InventoryCatalogRepository {
  constructor(
    @InjectRepository(UnitOfMeasureOrmEntity)
    private readonly units: Repository<UnitOfMeasureOrmEntity>,
    @InjectRepository(InventoryMovementTypeOrmEntity)
    private readonly types: Repository<InventoryMovementTypeOrmEntity>,
  ) {}

  async findUnits(): Promise<UnitOfMeasure[]> {
    const rows = await this.units.find({ order: { dimension: 'ASC', conversionFactorToBase: 'DESC' } });
    return rows.map(toUnit);
  }

  async findUnit(code: string): Promise<UnitOfMeasure | null> {
    const found = await this.units.findOne({ where: { code } });
    return found ? toUnit(found) : null;
  }

  async updateUnit(code: string, changes: { name?: string; isActive?: boolean }): Promise<void> {
    await this.units.update({ code }, withoutUndefined(changes));
  }

  async findMovementTypes(): Promise<MovementType[]> {
    const rows = await this.types.find({ order: { createdAt: 'ASC', code: 'ASC' } });
    return rows.map(toType);
  }

  async findMovementType(code: string): Promise<MovementType | null> {
    const found = await this.types.findOne({ where: { code } });
    return found ? toType(found) : null;
  }

  async renameMovementType(code: string, name: string): Promise<void> {
    await this.types.update({ code }, { name });
  }

  async ensureCatalog(units: UnitDefinition[], types: MovementTypeDefinition[]): Promise<void> {
    for (const unit of units) {
      const fixed = { dimension: unit.dimension, conversionFactorToBase: unit.conversionFactorToBase };
      const existing = await this.units.findOne({ where: { code: unit.code } });
      if (existing) {
        await this.units.update({ id: existing.id }, fixed);
      } else {
        await this.units.insert({ code: unit.code, name: unit.name, ...fixed });
      }
    }
    for (const type of types) {
      const existing = await this.types.findOne({ where: { code: type.code } });
      if (existing) {
        await this.types.update({ id: existing.id }, { effect: type.effect });
      } else {
        await this.types.insert({ code: type.code, name: type.name, effect: type.effect });
      }
    }
  }
}
