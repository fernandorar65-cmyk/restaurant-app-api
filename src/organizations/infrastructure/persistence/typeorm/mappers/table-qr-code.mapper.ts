import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';
import { TableQrCodeOrmEntity } from '../entities/table-qr-code.orm-entity.js';

export class TableQrCodeMapper {
  static toDomain(orm: TableQrCodeOrmEntity): TableQrCode {
    return TableQrCode.fromPersistence({
      id: orm.id,
      codeUrl: orm.codeUrl,
      diningTableId: orm.diningTableId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: TableQrCode,
    existing?: TableQrCodeOrmEntity,
  ): TableQrCodeOrmEntity {
    const orm = existing ?? new TableQrCodeOrmEntity();
    orm.id = domain.id;
    orm.codeUrl = domain.codeUrl;
    orm.diningTableId = domain.diningTableId;
    return orm;
  }
}
