import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';
import { TableQrCodeRepository } from '../../../../domain/repositories/table-qr-code.repository.js';
import { TableQrCodeOrmEntity } from '../entities/table-qr-code.orm-entity.js';
import { TableQrCodeMapper } from '../mappers/table-qr-code.mapper.js';

@Injectable()
export class TypeOrmTableQrCodeRepository implements TableQrCodeRepository {
  constructor(
    @InjectRepository(TableQrCodeOrmEntity)
    private readonly repository: Repository<TableQrCodeOrmEntity>,
  ) {}

  async findById(id: string): Promise<TableQrCode | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? TableQrCodeMapper.toDomain(found) : null;
  }

  async findByDiningTableId(diningTableId: string): Promise<TableQrCode | null> {
    const found = await this.repository.findOne({ where: { diningTableId } });
    return found ? TableQrCodeMapper.toDomain(found) : null;
  }

  async findAll(): Promise<TableQrCode[]> {
    const rows = await this.repository.find();
    return rows.map(TableQrCodeMapper.toDomain);
  }

  async save(tableQrCode: TableQrCode): Promise<TableQrCode> {
    const existing = await this.repository.findOne({
      where: { id: tableQrCode.id },
    });
    const orm = TableQrCodeMapper.toPersistence(
      tableQrCode,
      existing ?? undefined,
    );
    const saved = await this.repository.save(orm);
    return TableQrCodeMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
