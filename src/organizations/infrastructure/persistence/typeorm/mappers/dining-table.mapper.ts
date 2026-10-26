import { DiningTable } from '../../../../domain/entities/dining-table.entity.js';
import { DiningTableOrmEntity } from '../entities/dining-table.orm-entity.js';

export class DiningTableMapper {
  static toDomain(orm: DiningTableOrmEntity): DiningTable {
    return DiningTable.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      floorId: orm.floorId,
      code: orm.code,
      name: orm.name,
      capacity: orm.capacity,
      operationalStatus: orm.operationalStatus,
      serviceStatus: orm.serviceStatus,
      positionX: orm.positionX,
      positionY: orm.positionY,
      qrTokenHash: orm.qrTokenHash,
      qrVersion: orm.qrVersion,
      qrGeneratedAt: orm.qrGeneratedAt,
      qrAssetUrl: orm.qrAssetUrl,
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
    orm.restaurantId = domain.restaurantId;
    orm.floorId = domain.floorId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.capacity = domain.capacity;
    orm.operationalStatus = domain.operationalStatus;
    orm.serviceStatus = domain.serviceStatus;
    orm.positionX = domain.positionX;
    orm.positionY = domain.positionY;
    orm.qrTokenHash = domain.qrTokenHash;
    orm.qrVersion = domain.qrVersion;
    orm.qrGeneratedAt = domain.qrGeneratedAt;
    orm.qrAssetUrl = domain.qrAssetUrl;
    return orm;
  }
}
