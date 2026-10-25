import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { TableQrCode } from '../entities/table-qr-code.entity.js';

export const TABLE_QR_CODE_REPOSITORY = Symbol('TABLE_QR_CODE_REPOSITORY');

export interface TableQrCodeRepository {
  findById(id: string): Promise<TableQrCode | null>;
  findActiveByTokenHash(tokenHash: string): Promise<TableQrCode | null>;
  findActiveByDiningTableId(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<TableQrCode | null>;
  findLatestVersion(
    diningTableId: string,
    tx?: TransactionContext,
  ): Promise<number>;
  findAll(filter?: { diningTableId?: string }): Promise<TableQrCode[]>;
  save(qrCode: TableQrCode, tx?: TransactionContext): Promise<TableQrCode>;
}
