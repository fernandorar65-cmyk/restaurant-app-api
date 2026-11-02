import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/infrastructure/persistence/typeorm-transaction-runner.js';
import { IamModule } from '../iam/iam.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { PaymentsLedgerModule } from '../payments/payments-ledger.module.js';
import { AttentionSettingsModule } from './attention-settings.module.js';
import { AttentionReportsService } from './application/attention-reports/attention-reports.service.js';
import { AttentionLifecycleService } from './application/attentions/attention-lifecycle.service.js';
import { AttentionOpeningService } from './application/attentions/attention-opening.service.js';
import { AttentionQueriesService } from './application/attentions/attention-queries.service.js';
import { CustomerAttentionsService } from './application/customer-attentions/customer-attentions.service.js';
import { DinerAttentionStartService } from './application/customer-attentions/diner-attention-start.service.js';
import { OrderItemsService } from './application/order-items/order-items.service.js';
import { OrderSubmissionService } from './application/orders/order-submission.service.js';
import { OrdersService } from './application/orders/orders.service.js';
import { DINING_TABLE_LOOKUP } from './application/ports/dining-table-lookup.port.js';
import { PAYMENT_LEDGER } from './application/ports/payment-ledger.port.js';
import { PRODUCT_LOOKUP } from './application/ports/product-lookup.port.js';
import { TABLE_QR_LOOKUP } from './application/ports/table-qr-lookup.port.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from './domain/repositories/attention-participant.repository.js';
import { ATTENTION_REPOSITORY } from './domain/repositories/attention.repository.js';
import { FULFILLMENT_REPOSITORY } from './domain/repositories/fulfillment.repository.js';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.js';
import { ORDER_ITEM_STATUS_HISTORY_REPOSITORY } from './domain/repositories/order-item-status-history.repository.js';
import { ORDER_ITEM_REPOSITORY } from './domain/repositories/order-item.repository.js';
import { DinerIdentityResolver } from './infrastructure/http/auth/diner-identity.resolver.js';
import { AttentionScopeResolvers } from './infrastructure/http/attention-scope-resolvers.js';
import { AttentionsController } from './infrastructure/http/controllers/attentions.controller.js';
import { FloorPlanController } from './infrastructure/http/controllers/floor-plan.controller.js';
import { FloorPlanService } from './application/floor-plan/floor-plan.service.js';
import { CustomerVisitsController } from './infrastructure/http/controllers/customer-visits.controller.js';
import { CustomerAttentionsController } from './infrastructure/http/controllers/customer-attentions.controller.js';
import { OrderItemsController } from './infrastructure/http/controllers/order-items.controller.js';
import { TableQrController } from './infrastructure/http/controllers/table-qr.controller.js';
import { InternalDiningTableLookupAdapter } from './infrastructure/lookups/internal-dining-table-lookup.adapter.js';
import { InternalProductLookupAdapter } from './infrastructure/lookups/internal-product-lookup.adapter.js';
import { InternalTableQrLookupAdapter } from './infrastructure/lookups/internal-table-qr-lookup.adapter.js';
import { InternalPaymentLedgerAdapter } from './infrastructure/lookups/internal-payment-ledger.adapter.js';
import { AttentionParticipantOrmEntity } from './infrastructure/persistence/typeorm/entities/attention-participant.orm-entity.js';
import { AttentionOrmEntity } from './infrastructure/persistence/typeorm/entities/attention.orm-entity.js';
import { FulfillmentOrmEntity } from './infrastructure/persistence/typeorm/entities/fulfillment.orm-entity.js';
import { OrderOrmEntity } from './infrastructure/persistence/typeorm/entities/order.orm-entity.js';
import { OrderItemStatusHistoryOrmEntity } from './infrastructure/persistence/typeorm/entities/order-item-status-history.orm-entity.js';
import { OrderItemOrmEntity } from './infrastructure/persistence/typeorm/entities/order-item.orm-entity.js';
import { TypeOrmAttentionParticipantRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-attention-participant.repository.js';
import { TypeOrmAttentionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-attention.repository.js';
import { TypeOrmFulfillmentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-fulfillment.repository.js';
import { TypeOrmOrderRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order.repository.js';
import { TypeOrmOrderItemStatusHistoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order-item-status-history.repository.js';
import { TypeOrmOrderItemRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order-item.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttentionOrmEntity,
      AttentionParticipantOrmEntity,
      OrderOrmEntity,
      OrderItemOrmEntity,
      OrderItemStatusHistoryOrmEntity,
      FulfillmentOrmEntity,
    ]),
    AttentionSettingsModule,
    OrganizationsModule,
    CatalogModule,
    IamModule,
    PaymentsLedgerModule,
  ],
  controllers: [
    AttentionsController,
    OrderItemsController,
    CustomerAttentionsController,
    TableQrController,
    CustomerVisitsController,
    FloorPlanController,
  ],
  providers: [
    AttentionScopeResolvers,
    AttentionOpeningService,
    AttentionLifecycleService,
    AttentionQueriesService,
    FloorPlanService,
    AttentionReportsService,
    OrderSubmissionService,
    OrdersService,
    OrderItemsService,
    CustomerAttentionsService,
    DinerAttentionStartService,
    DinerIdentityResolver,
    { provide: ATTENTION_REPOSITORY, useClass: TypeOrmAttentionRepository },
    {
      provide: ATTENTION_PARTICIPANT_REPOSITORY,
      useClass: TypeOrmAttentionParticipantRepository,
    },
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
    { provide: ORDER_ITEM_REPOSITORY, useClass: TypeOrmOrderItemRepository },
    {
      provide: ORDER_ITEM_STATUS_HISTORY_REPOSITORY,
      useClass: TypeOrmOrderItemStatusHistoryRepository,
    },
    { provide: FULFILLMENT_REPOSITORY, useClass: TypeOrmFulfillmentRepository },
    { provide: TABLE_QR_LOOKUP, useClass: InternalTableQrLookupAdapter },
    {
      provide: DINING_TABLE_LOOKUP,
      useClass: InternalDiningTableLookupAdapter,
    },
    { provide: PRODUCT_LOOKUP, useClass: InternalProductLookupAdapter },
    { provide: PAYMENT_LEDGER, useClass: InternalPaymentLedgerAdapter },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [AttentionReportsService, AttentionQueriesService],
})
export class AttentionModule {}
