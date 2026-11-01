import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { TableOperationalStatus } from '../enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../enums/table-service-status.enum.js';
import { DiningTable, type DiningTableDetails } from './dining-table.entity.js';

function createTable(details: DiningTableDetails = {}): DiningTable {
  return DiningTable.create({
    id: 'table-1',
    restaurantId: 'r1',
    floorId: 'floor-1',
    code: 'M1',
    name: 'Mesa 1',
    ...details,
  });
}

describe('DiningTable', () => {
  describe('create', () => {
    it('starts active, available and without a QR', () => {
      const table = createTable({
        code: ' M1 ',
        name: ' Mesa 1 ',
        capacity: 4,
      });
      expect(table.code).toBe('M1');
      expect(table.name).toBe('Mesa 1');
      expect(table.capacity).toBe(4);
      expect(table.operationalStatus).toBe(TableOperationalStatus.ACTIVE);
      expect(table.serviceStatus).toBe(TableServiceStatus.AVAILABLE);
      expect(table.isOperational).toBe(true);
      expect(table.hasActiveQr).toBe(false);
      expect(table.qrVersion).toBeNull();
    });

    it.each([
      ['an empty code', { code: ' ' }],
      ['a code over 50 chars', { code: 'C'.repeat(51) }],
      ['an empty name', { name: '' }],
      ['a name over 100 chars', { name: 'N'.repeat(101) }],
      ['a capacity of 0', { capacity: 0 }],
      ['a negative capacity', { capacity: -2 }],
    ])('rejects %s', (_label, details: DiningTableDetails) => {
      expect(() => createTable(details)).toThrow(ValidationDomainError);
    });

    it('allows an unknown capacity', () => {
      expect(createTable({ capacity: null }).capacity).toBeNull();
    });
  });

  describe('update', () => {
    it('moves the table and changes its statuses', () => {
      const table = createTable({ capacity: 4 });
      table.update({
        floorId: 'floor-2',
        positionX: 10,
        positionY: 20,
        serviceStatus: TableServiceStatus.CLEANING,
      });
      expect(table.floorId).toBe('floor-2');
      expect([table.positionX, table.positionY]).toEqual([10, 20]);
      expect(table.serviceStatus).toBe(TableServiceStatus.CLEANING);
      expect(table.capacity).toBe(4);
      expect(table.isOperational).toBe(true);
    });

    it.each([
      TableOperationalStatus.INACTIVE,
      TableOperationalStatus.MAINTENANCE,
    ])('is not operational while %s', (operationalStatus) => {
      const table = createTable();
      table.update({ operationalStatus });
      expect(table.isOperational).toBe(false);
    });

    it('validates the details like create', () => {
      expect(() => createTable().update({ capacity: 0 })).toThrow(
        ValidationDomainError,
      );
    });
  });

  describe('QR', () => {
    it('starts at version 1 and increments on every rotation', () => {
      const table = createTable();
      table.rotateQr('hash-1', 'https://blob/qr-1.png');
      expect(table.hasActiveQr).toBe(true);
      expect(table.qrTokenHash).toBe('hash-1');
      expect(table.qrVersion).toBe(1);
      expect(table.qrGeneratedAt).toBeInstanceOf(Date);
      expect(table.qrAssetUrl).toBe('https://blob/qr-1.png');

      table.rotateQr('hash-2');
      expect(table.qrTokenHash).toBe('hash-2');
      expect(table.qrVersion).toBe(2);
      expect(table.qrAssetUrl).toBeNull();
    });

    it('revoking leaves no valid QR but keeps the version', () => {
      const table = createTable();
      table.rotateQr('hash-1', 'https://blob/qr-1.png');
      table.revokeQr();
      expect(table.hasActiveQr).toBe(false);
      expect(table.qrTokenHash).toBeNull();
      expect(table.qrGeneratedAt).toBeNull();
      expect(table.qrAssetUrl).toBeNull();
      expect(table.qrVersion).toBe(1);

      table.rotateQr('hash-2');
      expect(table.qrVersion).toBe(2);
    });
  });
});
