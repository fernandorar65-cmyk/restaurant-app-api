import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { ServiceType } from '../../domain/entities/service-type.entity.js';
import type { ServiceTypeSettings } from '../../domain/entities/service-type.entity.js';
import { FulfillmentMode } from '../../domain/enums/fulfillment-mode.enum.js';
import {
  InvalidServiceSetupError,
  ServiceModeDisabledError,
  ServiceTypeNotFoundError,
} from '../../domain/exceptions/attention.errors.js';
import { SERVICE_TYPE_REPOSITORY } from '../../domain/repositories/service-type.repository.js';
import type { ServiceTypeRepository } from '../../domain/repositories/service-type.repository.js';

export interface CreateServiceTypeInput extends ServiceTypeSettings {
  restaurantId: string;
  code: string;
  name: string;
  fulfillmentMode: FulfillmentMode;
  sortOrder: number;
}

/** Created for every restaurant; only dine-in starts enabled. */
const DEFAULT_SERVICE_TYPES: Omit<CreateServiceTypeInput, 'restaurantId'>[] = [
  {
    code: 'DINE_IN',
    name: 'En mesa',
    fulfillmentMode: FulfillmentMode.DINE_IN,
    sortOrder: 10,
  },
  {
    code: 'PICKUP',
    name: 'Para recoger',
    fulfillmentMode: FulfillmentMode.PICKUP,
    sortOrder: 20,
  },
  {
    code: 'DELIVERY',
    name: 'Delivery',
    fulfillmentMode: FulfillmentMode.DELIVERY,
    sortOrder: 30,
  },
];

@Injectable()
export class ServiceTypesService {
  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  /** Idempotent: only the default codes that are missing are inserted. */
  async seedDefaults(
    restaurantId: string,
    tx?: TransactionContext,
  ): Promise<void> {
    const defaults = DEFAULT_SERVICE_TYPES.map((input) => {
      const serviceType = ServiceType.create({
        ...input,
        id: randomUUID(),
        restaurantId,
      });
      if (input.fulfillmentMode !== FulfillmentMode.DINE_IN) {
        serviceType.configure({ isActive: false });
      }
      return serviceType;
    });
    await this.serviceTypeRepository.seedDefaults(restaurantId, defaults, tx);
  }

  list(restaurantId: string): Promise<ServiceType[]> {
    return this.serviceTypeRepository.findByRestaurant(restaurantId);
  }

  async findOne(id: string): Promise<ServiceType> {
    const serviceType = await this.serviceTypeRepository.findById(id);
    if (!serviceType) {
      throw new ServiceTypeNotFoundError(id);
    }
    return serviceType;
  }

  create(input: CreateServiceTypeInput): Promise<ServiceType> {
    return this.serviceTypeRepository.save(
      ServiceType.create({ ...input, id: randomUUID() }),
    );
  }

  /** Deactivating is how a type is retired: attentions that used it keep it. */
  async update(
    id: string,
    input: ServiceTypeSettings & { isActive?: boolean },
  ): Promise<ServiceType> {
    const serviceType = await this.findOne(id);
    serviceType.configure(input);
    return this.serviceTypeRepository.save(serviceType);
  }

  /**
   * The active type an attention is opened with: the one chosen by id (it
   * must belong to the restaurant when one is given), or the restaurant's
   * first active type of the requested mode.
   */
  async resolveActive(input: {
    restaurantId?: string | null;
    serviceTypeId?: string | null;
    fulfillmentMode?: FulfillmentMode | null;
  }): Promise<ServiceType> {
    if (input.serviceTypeId) {
      const serviceType = await this.serviceTypeRepository.findById(
        input.serviceTypeId,
      );
      if (
        !serviceType ||
        (input.restaurantId && serviceType.restaurantId !== input.restaurantId)
      ) {
        throw new ServiceTypeNotFoundError(input.serviceTypeId);
      }
      if (!serviceType.isActive) {
        throw new ServiceModeDisabledError(serviceType.name);
      }
      return serviceType;
    }
    if (!input.fulfillmentMode) {
      throw new InvalidServiceSetupError(
        'Indica el tipo de servicio (serviceTypeId o fulfillmentMode)',
      );
    }
    if (!input.restaurantId) {
      throw new InvalidServiceSetupError(
        `${input.fulfillmentMode} requiere un restaurante (o el serviceTypeId)`,
      );
    }
    const candidates = await this.serviceTypeRepository.findByRestaurant(
      input.restaurantId,
    );
    const serviceType = candidates.find(
      (candidate) =>
        candidate.isActive &&
        candidate.fulfillmentMode === input.fulfillmentMode,
    );
    if (!serviceType) {
      throw new ServiceModeDisabledError(input.fulfillmentMode);
    }
    return serviceType;
  }
}
