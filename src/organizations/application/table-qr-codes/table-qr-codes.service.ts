import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TableQrCode } from '../../domain/entities/table-qr-code.entity.js';
import {
  DuplicateTableQrCodeError,
  TableQrCodeNotFoundError,
} from '../../domain/exceptions/table-qr-code.errors.js';
import { TABLE_QR_CODE_REPOSITORY } from '../../domain/repositories/table-qr-code.repository.js';
import type { TableQrCodeRepository } from '../../domain/repositories/table-qr-code.repository.js';
import { DiningTablesService } from '../dining-tables/dining-tables.service.js';

export interface CreateTableQrCodeInput {
  codeUrl: string;
  diningTableId: string;
}

export interface UpdateTableQrCodeInput {
  codeUrl?: string;
  diningTableId?: string;
}

@Injectable()
export class TableQrCodesService {
  constructor(
    @Inject(TABLE_QR_CODE_REPOSITORY)
    private readonly tableQrCodeRepository: TableQrCodeRepository,
    private readonly diningTablesService: DiningTablesService,
  ) {}

  async create(input: CreateTableQrCodeInput): Promise<TableQrCode> {
    await this.diningTablesService.findOne(input.diningTableId);

    const existing = await this.tableQrCodeRepository.findByDiningTableId(
      input.diningTableId,
    );
    if (existing) {
      throw new DuplicateTableQrCodeError();
    }

    const tableQrCode = TableQrCode.create({ id: randomUUID(), ...input });
    return this.tableQrCodeRepository.save(tableQrCode);
  }

  findAll(): Promise<TableQrCode[]> {
    return this.tableQrCodeRepository.findAll();
  }

  async findOne(id: string): Promise<TableQrCode> {
    const tableQrCode = await this.tableQrCodeRepository.findById(id);
    if (!tableQrCode) {
      throw new TableQrCodeNotFoundError(id);
    }
    return tableQrCode;
  }

  async update(
    id: string,
    input: UpdateTableQrCodeInput,
  ): Promise<TableQrCode> {
    const tableQrCode = await this.findOne(id);
    if (input.diningTableId) {
      await this.diningTablesService.findOne(input.diningTableId);
    }
    tableQrCode.update(input);
    return this.tableQrCodeRepository.save(tableQrCode);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.tableQrCodeRepository.delete(id);
    if (!deleted) {
      throw new TableQrCodeNotFoundError(id);
    }
  }
}
