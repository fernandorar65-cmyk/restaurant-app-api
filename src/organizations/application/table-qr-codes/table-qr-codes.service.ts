import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import {
  generateOpaqueToken,
  hashToken,
} from '../../../common/application/security/opaque-token.js';
import { DiningTable } from '../../domain/entities/dining-table.entity.js';
import { Restaurant } from '../../domain/entities/restaurant.entity.js';
import { TableQrCode } from '../../domain/entities/table-qr-code.entity.js';
import {
  InactiveDiningTableError,
  TableQrCodeNotFoundError,
} from '../../domain/exceptions/table-qr-code.errors.js';
import { TABLE_QR_CODE_REPOSITORY } from '../../domain/repositories/table-qr-code.repository.js';
import type { TableQrCodeRepository } from '../../domain/repositories/table-qr-code.repository.js';
import { DiningTablesService } from '../dining-tables/dining-tables.service.js';
import { RestaurantsService } from '../restaurants/restaurants.service.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface GeneratedTableQrCode {
  qrCode: TableQrCode;
  /** Raw token to print in the QR. It is never stored nor returned again. */
  token: string;
}

export interface ResolvedTableQrCode {
  qrCode: TableQrCode;
  table: DiningTable;
  restaurant: Restaurant;
}

@Injectable()
export class TableQrCodesService {
  constructor(
    @Inject(TABLE_QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: TableQrCodeRepository,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly diningTablesService: DiningTablesService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  /**
   * Issues a new QR version for the table, revoking the active one (if any)
   * in the same transaction so there is never more than one valid QR.
   */
  async generate(diningTableId: string): Promise<GeneratedTableQrCode> {
    await this.diningTablesService.findOne(diningTableId);
    const token = generateOpaqueToken();

    const qrCode = await this.transactionRunner.run(async (tx) => {
      const active = await this.qrCodeRepository.findActiveByDiningTableId(
        diningTableId,
        tx,
      );
      if (active) {
        active.revoke();
        await this.qrCodeRepository.save(active, tx);
      }
      const latestVersion = await this.qrCodeRepository.findLatestVersion(
        diningTableId,
        tx,
      );
      return this.qrCodeRepository.save(
        TableQrCode.generate({
          id: randomUUID(),
          diningTableId,
          tokenHash: hashToken(token),
          version: latestVersion + 1,
        }),
        tx,
      );
    });

    return { qrCode, token };
  }

  findPage(
    filter: { diningTableId?: string },
    page: PageRequest,
  ): Promise<Page<TableQrCode>> {
    return this.qrCodeRepository.findPage(filter, page);
  }

  async findOne(id: string): Promise<TableQrCode> {
    const qrCode = await this.qrCodeRepository.findById(id);
    if (!qrCode) {
      throw new TableQrCodeNotFoundError(id);
    }
    return qrCode;
  }

  async revoke(id: string): Promise<TableQrCode> {
    const qrCode = await this.findOne(id);
    qrCode.revoke();
    return this.qrCodeRepository.save(qrCode);
  }

  /**
   * Resolves a scanned token to its table and restaurant. Returns null for
   * unknown or revoked tokens; throws if the table can't take diners.
   */
  async resolveToken(token: string): Promise<ResolvedTableQrCode | null> {
    const qrCode = await this.qrCodeRepository.findActiveByTokenHash(
      hashToken(token),
    );
    if (!qrCode) {
      return null;
    }
    const table = await this.diningTablesService.findOne(qrCode.diningTableId);
    if (!table.isOperational) {
      throw new InactiveDiningTableError(table.id);
    }
    const restaurant = await this.restaurantsService.findOne(table.restaurantId);
    return { qrCode, table, restaurant };
  }
}
