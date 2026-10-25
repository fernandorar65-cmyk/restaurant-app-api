import { DiningTable } from '../../../../domain/entities/dining-table.entity.js';
import { DiningTableOrmEntity } from '../entities/dining-table.orm-entity.js';

export class DiningTableMapper {
  static toDomain(orm: DiningTableOrmEntity): DiningTable {
    return DiningTable.fromPersistence({
      id: orm.id,
      tableNumber: orm.tableNumber,
      capacity: orm.capacity,
      status: orm.status,
      restaurantId: orm.restaurantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: DiningTable,
    existing?: DiningTableOrmEntity,
  ): DiningTableOrmEntity {
    const orm = existing ?? new DiningTableOrmEntity();
    orm.id = domain.id;
    orm.tableNumber = domain.tableNumber;
    orm.capacity = domain.capacity;
    orm.status = domain.status;
    orm.restaurantId = domain.restaurantId;
    return orm;
  }
}
