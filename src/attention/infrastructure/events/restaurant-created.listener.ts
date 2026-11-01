import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS } from '../../../common/application/ports/event-bus.port.js';
import type { EventBus } from '../../../common/application/ports/event-bus.port.js';
import { RestaurantCreated } from '../../../organizations/public-api.js';
import { ServiceTypesService } from '../../application/attention-settings/service-types.service.js';
import { WorkflowStatusesService } from '../../application/attention-settings/workflow-statuses.service.js';

/**
 * Gives every new restaurant its default statuses and service types, inside
 * the transaction that created it: a restaurant never exists without them.
 */
@Injectable()
export class RestaurantCreatedListener implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    private readonly statuses: WorkflowStatusesService,
    private readonly serviceTypes: ServiceTypesService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe(RestaurantCreated, async (event, tx) => {
      await this.statuses.seedDefaults(event.restaurantId, tx);
      await this.serviceTypes.seedDefaults(event.restaurantId, tx);
    });
  }
}
