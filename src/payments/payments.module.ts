import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttentionModule } from '../attention/attention.module.js';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { PaymentCatalogService } from './application/payment-catalog/payment-catalog.service.js';
import { PaymentLedgerService } from './application/payment-ledger/payment-ledger.service.js';
import { PaymentsService } from './application/payments/payments.service.js';
import { ATTENTION_BILLING } from './application/ports/attention-billing.port.js';
import { ProviderEventsService } from './application/provider-events/provider-events.service.js';
import {
  PAYMENT_STATUS_REPOSITORY,
  PROVIDER_EVENT_REPOSITORY,
  PROVIDER_STATUS_MAPPING_REPOSITORY,
} from './domain/repositories/payment-catalog.repository.js';
import { PAYMENT_LEDGER_REPOSITORY } from './domain/repositories/payment-ledger.repository.js';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository.js';
import { PaymentsController } from './infrastructure/http/controllers/payments.controller.js';
import { PlatformPaymentsController } from './infrastructure/http/controllers/platform-payments.controller.js';
import { InternalAttentionBillingAdapter } from './infrastructure/lookups/internal-attention-billing.adapter.js';
import { PaymentAllocationOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-allocation.orm-entity.js';
import { PaymentProviderEventOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-provider-event.orm-entity.js';
import { PaymentProviderStatusMappingOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-provider-status-mapping.orm-entity.js';
import { PaymentStatusOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-status.orm-entity.js';
import { PaymentOrmEntity } from './infrastructure/persistence/typeorm/entities/payment.orm-entity.js';
import { RefundAllocationOrmEntity } from './infrastructure/persistence/typeorm/entities/refund-allocation.orm-entity.js';
import { RefundProviderStatusMappingOrmEntity } from './infrastructure/persistence/typeorm/entities/refund-provider-status-mapping.orm-entity.js';
import { RefundStatusOrmEntity } from './infrastructure/persistence/typeorm/entities/refund-status.orm-entity.js';
import { RefundOrmEntity } from './infrastructure/persistence/typeorm/entities/refund.orm-entity.js';
import {
  TypeOrmPaymentStatusRepository,
  TypeOrmProviderEventRepository,
  TypeOrmProviderStatusMappingRepository,
} from './infrastructure/persistence/typeorm/repositories/typeorm-payment-catalog.repositories.js';
import { TypeOrmPaymentLedgerRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-payment-ledger.repository.js';
import { TypeOrmPaymentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-payment.repository.js';

/**
 * Payments independent of any gateway: internal statuses, translation of
 * each provider's statuses, allocations per product and (modeled, not yet
 * enabled) refunds. Attention and payments need each other (the bill needs
 * what was paid; a payment needs what is owed), hence the forwardRef.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentStatusOrmEntity,
      PaymentOrmEntity,
      PaymentAllocationOrmEntity,
      PaymentProviderStatusMappingOrmEntity,
      PaymentProviderEventOrmEntity,
      RefundStatusOrmEntity,
      RefundOrmEntity,
      RefundAllocationOrmEntity,
      RefundProviderStatusMappingOrmEntity,
    ]),
    forwardRef(() => AttentionModule),
    OrganizationsModule,
  ],
  controllers: [PaymentsController, PlatformPaymentsController],
  providers: [
    PaymentLedgerService,
    PaymentsService,
    PaymentCatalogService,
    ProviderEventsService,
    { provide: PAYMENT_LEDGER_REPOSITORY, useClass: TypeOrmPaymentLedgerRepository },
    { provide: PAYMENT_REPOSITORY, useClass: TypeOrmPaymentRepository },
    { provide: PAYMENT_STATUS_REPOSITORY, useClass: TypeOrmPaymentStatusRepository },
    {
      provide: PROVIDER_STATUS_MAPPING_REPOSITORY,
      useClass: TypeOrmProviderStatusMappingRepository,
    },
    { provide: PROVIDER_EVENT_REPOSITORY, useClass: TypeOrmProviderEventRepository },
    { provide: ATTENTION_BILLING, useClass: InternalAttentionBillingAdapter },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [PaymentLedgerService],
})
export class PaymentsModule {}
