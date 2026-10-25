import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';
import { TableQrCodeRepository } from '../../../../domain/repositories/table-qr-code.repository.js';
import { TableQrCodeOrmEntity } from '../entities/table-qr-code.orm-entity.js';
import { TableQrCodeMapper } from '../mappers/table-qr-code.mapper.js';

@Injectable()
export class TypeOrmTableQrCodeRepository
  extends TypeOrmBaseRepository<TableQrCode, TableQrCodeOrmEntity>
  implements TableQrCodeRepository
{
  constructor(
    @InjectRepository(TableQrCodeOrmEntity)
    repository: Repository<TableQrCodeOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: TableQrCodeOrmEntity): TableQrCode {
    return TableQrCodeMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: TableQrCode,
    existing?: TableQrCodeOrmEntity,
  ): TableQrCodeOrmEntity {
    return TableQrCodeMapper.toPersistence(domain, existing);
  }

  async findByDiningTableId(diningTableId: string): Promise<TableQrCode | null> {
    const found = await this.repository.findOne({ where: { diningTableId } });
    return found ? this.toDomain(found) : null;
  }
}
