import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import type { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import type { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { SERVICE_TYPE_REPOSITORY } from '../../domain/repositories/service-type.repository.js';
import type { ServiceTypeRepository } from '../../domain/repositories/service-type.repository.js';
import {
  ATTENTION_STATUS_REPOSITORY,
  ORDER_STATUS_REPOSITORY,
} from '../../domain/repositories/workflow-status.repository.js';
import type { WorkflowStatusRepository } from '../../domain/repositories/workflow-status.repository.js';

/** Tells the authorization guard which restaurant each setting belongs to. */
@Injectable()
export class AttentionSettingsScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(ATTENTION_STATUS_REPOSITORY)
    private readonly attentionStatuses: WorkflowStatusRepository<AttentionStatus>,
    @Inject(ORDER_STATUS_REPOSITORY)
    private readonly orderStatuses: WorkflowStatusRepository<OrderStatus>,
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypes: ServiceTypeRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('attention-status', async (id) => {
      const status = await this.attentionStatuses.findById(id);
      return status && { restaurantId: status.restaurantId };
    });
    this.registry.register('order-status', async (id) => {
      const status = await this.orderStatuses.findById(id);
      return status && { restaurantId: status.restaurantId };
    });
    this.registry.register('service-type', async (id) => {
      const serviceType = await this.serviceTypes.findById(id);
      return serviceType && { restaurantId: serviceType.restaurantId };
    });
  }
}
