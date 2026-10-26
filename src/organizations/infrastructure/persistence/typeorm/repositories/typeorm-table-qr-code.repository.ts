import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import type { TransactionContext } from '../../../../../common/domain/transaction-context.js';
import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';
import { TableQrCodeRepository } from '../../../../domain/repositories/table-qr-code.repository.js';
import { TableQrCodeOrmEntity } from '../entities/table-qr-code.orm-entity.js';
import { TableQrCodeMapper } from '../mappers/table-qr-code.mapper.js';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';

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

  async findPage(
    filter: { diningTableId?: string },
    page: PageRequest,
  ): Promise<Page<TableQrCode>> {
    return this.findPageBy({
      where: { diningTableId: filter.diningTableId },
      order: { generatedAt: 'DESC' },
    }, page);
  }

  async findActiveByTokenHash(tokenHash: string): Promise<TableQrCode | null> {
    const found = await this.repository.findOne({
      where: { tokenHash, isActive: true },
    });
    return found ? this.toDomain(found) : null;
  }

  async findActiveByDiningTableId(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<TableQrCode | null> {
    const found = await this.getRepository(tx).findOne({
      where: { diningTableId, isActive: true },
    });
    return found ? this.toDomain(found) : null;
  }

  async findLatestVersion(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<number> {
    const latest = await this.getRepository(tx).maximum('version', {
      diningTableId,
    });
    return latest ?? 0;
  }
}
