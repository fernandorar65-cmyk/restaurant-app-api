import { Injectable } from '@nestjs/common';
import { ServiceTypesService } from '../../../attention/public-api.js';
import type {
  ServiceTypeLookupPort,
  ServiceTypeSnapshot,
} from '../../application/ports/service-type-lookup.port.js';
import type { ServiceMode } from '../../domain/service-mode.js';

/** In-process adapter over attention's service types. */
@Injectable()
export class InternalServiceTypeLookupAdapter implements ServiceTypeLookupPort {
  constructor(private readonly serviceTypes: ServiceTypesService) {}

  async findActive(
    restaurantId: string,
    mode: ServiceMode,
  ): Promise<ServiceTypeSnapshot | null> {
    const serviceTypes = await this.serviceTypes.list(restaurantId);
    const serviceType = serviceTypes.find(
      (candidate) => candidate.isActive && candidate.fulfillmentMode === mode,
    );
    return serviceType
      ? {
          minimumOrderAmount: serviceType.minimumOrderAmount,
          deliveryFee: serviceType.deliveryFee,
        }
      : null;
  }
}
