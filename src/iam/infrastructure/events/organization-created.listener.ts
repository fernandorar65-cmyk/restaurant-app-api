import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS } from '../../../common/application/ports/event-bus.port.js';
import type { EventBus } from '../../../common/application/ports/event-bus.port.js';
import { OrganizationCreated } from '../../../organizations/public-api.js';
import { AccessCatalogService } from '../../application/access-catalog/access-catalog.service.js';

/** Every new organization starts with the base roles, in its own transaction. */
@Injectable()
export class OrganizationCreatedListener implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    private readonly accessCatalog: AccessCatalogService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe(OrganizationCreated, (event, tx) =>
      this.accessCatalog.provisionBaseRoles(event.organizationId, tx),
    );
  }
}
