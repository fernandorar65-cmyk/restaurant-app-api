import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiningTablesService } from '../dining-tables/dining-tables.service.js';
import { CreateTableQrCodeDto } from './dto/create-table-qr-code.dto.js';
import { UpdateTableQrCodeDto } from './dto/update-table-qr-code.dto.js';
import { TableQrCode } from './entities/table-qr-code.entity.js';

@Injectable()
export class TableQrCodesService {
  constructor(
    @InjectRepository(TableQrCode)
    private readonly tableQrCodesRepository: Repository<TableQrCode>,
    private readonly diningTablesService: DiningTablesService,
  ) {}

  async create(dto: CreateTableQrCodeDto): Promise<TableQrCode> {
    await this.diningTablesService.findOne(dto.diningTableId);

    const existing = await this.tableQrCodesRepository.findOne({
      where: { diningTableId: dto.diningTableId },
    });
    if (existing) {
      throw new ConflictException(
        'This dining table already has a QR code assigned',
      );
    }

    const tableQrCode = this.tableQrCodesRepository.create(dto);
    return this.tableQrCodesRepository.save(tableQrCode);
  }

  findAll(): Promise<TableQrCode[]> {
    return this.tableQrCodesRepository.find();
  }

  async findOne(id: string): Promise<TableQrCode> {
    const tableQrCode = await this.tableQrCodesRepository.findOne({
      where: { id },
    });
    if (!tableQrCode) {
      throw new NotFoundException(`Table QR code with id "${id}" not found`);
    }
    return tableQrCode;
  }

  async update(
    id: string,
    dto: UpdateTableQrCodeDto,
  ): Promise<TableQrCode> {
    const tableQrCode = await this.findOne(id);
    if (dto.diningTableId) {
      await this.diningTablesService.findOne(dto.diningTableId);
    }
    Object.assign(tableQrCode, dto);
    return this.tableQrCodesRepository.save(tableQrCode);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tableQrCodesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Table QR code with id "${id}" not found`);
    }
  }
}
