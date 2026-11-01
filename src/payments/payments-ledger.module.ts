import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentLedgerService } from './application/payment-ledger/payment-ledger.service.js';
import { PAYMENT_LEDGER_REPOSITORY } from './domain/repositories/payment-ledger.repository.js';
import { PaymentAllocationOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-allocation.orm-entity.js';
import { PaymentOrmEntity } from './infrastructure/persistence/typeorm/entities/payment.orm-entity.js';
import { RefundOrmEntity } from './infrastructure/persistence/typeorm/entities/refund.orm-entity.js';
import { TypeOrmPaymentLedgerRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-payment-ledger.repository.js';

/**
 * Public read API of the payments context (what was paid, by attention, by
 * product and by method). Kept apart from PaymentsModule, and with no
 * dependency on other modules, so attention can ask what was paid while
 * payments asks attention what is owed, without an import cycle.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentOrmEntity,
      PaymentAllocationOrmEntity,
      RefundOrmEntity,
    ]),
  ],
  providers: [
    PaymentLedgerService,
    {
      provide: PAYMENT_LEDGER_REPOSITORY,
      useClass: TypeOrmPaymentLedgerRepository,
    },
  ],
  exports: [PaymentLedgerService],
})
export class PaymentsLedgerModule {}
