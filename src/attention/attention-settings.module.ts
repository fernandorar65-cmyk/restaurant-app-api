import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TRANSACTION_RUNNER } from '../common/application/ports/transaction-runner.port.js';
import { TypeOrmTransactionRunner } from '../common/persistence/typeorm-transaction-runner.js';
import { ServiceTypesService } from './application/attention-settings/service-types.service.js';
import { WorkflowStatusesService } from './application/attention-settings/workflow-statuses.service.js';
import { SERVICE_TYPE_REPOSITORY } from './domain/repositories/service-type.repository.js';
import {
  ATTENTION_STATUS_REPOSITORY,
  ORDER_STATUS_REPOSITORY,
} from './domain/repositories/workflow-status.repository.js';
import {
  AttentionStatusesController,
  OrderStatusesController,
  ServiceTypesController,
} from './infrastructure/http/controllers/attention-settings.controllers.js';
import { ServiceTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/service-type.orm-entity.js';
import {
  AttentionStatusOrmEntity,
  OrderStatusOrmEntity,
} from './infrastructure/persistence/typeorm/entities/workflow-status.orm-entity.js';
import { TypeOrmServiceTypeRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-service-type.repository.js';
import {
  TypeOrmAttentionStatusRepository,
  TypeOrmOrderStatusRepository,
} from './infrastructure/persistence/typeorm/repositories/typeorm-workflow-status.repositories.js';

/**
 * Per-restaurant configuration of the attention context: status catalogs and
 * service types. Kept apart from AttentionModule (and with no dependency on
 * other contexts) so organizations can seed it when a restaurant is created
 * and catalog can read service types without import cycles. A restaurant
 * that doesn't exist is rejected by the foreign keys.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttentionStatusOrmEntity,
      OrderStatusOrmEntity,
      ServiceTypeOrmEntity,
    ]),
  ],
  controllers: [
    AttentionStatusesController,
    OrderStatusesController,
    ServiceTypesController,
  ],
  providers: [
    WorkflowStatusesService,
    ServiceTypesService,
    {
      provide: ATTENTION_STATUS_REPOSITORY,
      useClass: TypeOrmAttentionStatusRepository,
    },
    {
      provide: ORDER_STATUS_REPOSITORY,
      useClass: TypeOrmOrderStatusRepository,
    },
    {
      provide: SERVICE_TYPE_REPOSITORY,
      useClass: TypeOrmServiceTypeRepository,
    },
    { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
  ],
  exports: [WorkflowStatusesService, ServiceTypesService],
})
export class AttentionSettingsModule {}
