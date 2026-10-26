import { Injectable } from '@nestjs/common';
import { PaymentLedgerService } from '../../../payments/application/payment-ledger/payment-ledger.service.js';
import { PaymentLedgerPort } from '../../application/ports/payment-ledger.port.js';

/** In-process adapter over the payments context's public ledger service. */
@Injectable()
export class InternalPaymentLedgerAdapter implements PaymentLedgerPort {
  constructor(private readonly ledger: PaymentLedgerService) {}

  paidAmount(attentionId: string): Promise<number> {
    return this.ledger.paidAmount(attentionId);
  }
}
