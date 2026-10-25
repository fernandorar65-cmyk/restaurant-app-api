import { TableQrCode } from '../entities/table-qr-code.entity.js';

export const TABLE_QR_CODE_REPOSITORY = Symbol('TABLE_QR_CODE_REPOSITORY');

export interface TableQrCodeRepository {
  findById(id: string): Promise<TableQrCode | null>;
  findByDiningTableId(diningTableId: string): Promise<TableQrCode | null>;
  findAll(): Promise<TableQrCode[]>;
  save(tableQrCode: TableQrCode): Promise<TableQrCode>;
  delete(id: string): Promise<boolean>;
}
