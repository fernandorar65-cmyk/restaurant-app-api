import { Injectable } from '@nestjs/common';
import { ServiceTypesService } from '../../../attention/application/attention-settings/service-types.service.js';
import { WorkflowStatusesService } from '../../../attention/application/attention-settings/workflow-statuses.service.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import type { RestaurantSetupPort } from '../../application/ports/restaurant-setup.port.js';

/** In-process adapter over attention's per-restaurant settings. */
@Injectable()
export class InternalRestaurantSetupAdapter implements RestaurantSetupPort {
  constructor(
    private readonly statuses: WorkflowStatusesService,
    private readonly serviceTypes: ServiceTypesService,
  ) {}

  async provisionDefaults(
    restaurantId: string,
    tx: TransactionContext,
  ): Promise<void> {
    await this.statuses.seedDefaults(restaurantId, tx);
    await this.serviceTypes.seedDefaults(restaurantId, tx);
  }
}
