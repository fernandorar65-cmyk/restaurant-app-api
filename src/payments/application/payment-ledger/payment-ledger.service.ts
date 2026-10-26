import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_LEDGER_REPOSITORY } from '../../domain/repositories/payment-ledger.repository.js';
import type {
  MethodTotals,
  PaymentLedgerRepository,
} from '../../domain/repositories/payment-ledger.repository.js';

/**
 * Public read API of the payments context: other contexts (attention,
 * finance) ask here instead of reading payment tables themselves.
 */
@Injectable()
export class PaymentLedgerService {
  constructor(
    @Inject(PAYMENT_LEDGER_REPOSITORY)
    private readonly ledgerRepository: PaymentLedgerRepository,
  ) {}

  paidAmount(attentionId: string): Promise<number> {
    return this.ledgerRepository.paidAmount(attentionId);
  }

  itemsWithPayments(orderItemIds: string[]): Promise<string[]> {
    return this.ledgerRepository.itemsWithPayments(orderItemIds);
  }

  dailyTotals(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodTotals[]> {
    return this.ledgerRepository.dailyTotals(restaurantId, businessDate, timeZone);
  }
}
