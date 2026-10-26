import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { TableQrCode } from '../entities/table-qr-code.entity.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

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
  findPage(
    filter: { diningTableId?: string },
    page: PageRequest,
  ): Promise<Page<TableQrCode>>;
  save(qrCode: TableQrCode, tx?: TransactionContext): Promise<TableQrCode>;
}
