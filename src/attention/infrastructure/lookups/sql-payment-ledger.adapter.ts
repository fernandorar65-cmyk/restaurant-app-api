import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaymentLedgerPort } from '../../application/ports/payment-ledger.port.js';

/**
 * The payments context has its tables but no application services yet, so
 * this adapter reads them directly (shared database). Once payments exposes
 * a service, only this adapter needs to change.
 */
@Injectable()
export class SqlPaymentLedgerAdapter implements PaymentLedgerPort {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async paidAmount(attentionId: string): Promise<number> {
    const [row] = (await this.dataSource.query(
      `SELECT
         COALESCE((SELECT SUM(p.amount) FROM payments p
                   WHERE p.attention_id = $1
                     AND p.status IN ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED')), 0)
       - COALESCE((SELECT SUM(r.amount) FROM refunds r
                   JOIN payments p ON p.id = r.payment_id
                   WHERE p.attention_id = $1 AND r.status = 'REFUNDED'), 0)
         AS paid`,
      [attentionId],
    )) as { paid: string }[];
    return Number(row?.paid ?? 0);
  }
}
