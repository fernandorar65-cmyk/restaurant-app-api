import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';
import { TableQrCodeOrmEntity } from '../entities/table-qr-code.orm-entity.js';

export class TableQrCodeMapper {
  static toDomain(orm: TableQrCodeOrmEntity): TableQrCode {
    return TableQrCode.fromPersistence({
      id: orm.id,
      diningTableId: orm.diningTableId,
      tokenHash: orm.tokenHash,
      version: orm.version,
      isActive: orm.isActive,
      generatedAt: orm.generatedAt,
      revokedAt: orm.revokedAt,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(
    domain: TableQrCode,
    existing?: TableQrCodeOrmEntity,
  ): TableQrCodeOrmEntity {
    const orm = existing ?? new TableQrCodeOrmEntity();
    orm.id = domain.id;
    orm.diningTableId = domain.diningTableId;
    orm.tokenHash = domain.tokenHash;
    orm.version = domain.version;
    orm.isActive = domain.isActive;
    orm.generatedAt = domain.generatedAt;
    orm.revokedAt = domain.revokedAt;
    return orm;
  }
}
