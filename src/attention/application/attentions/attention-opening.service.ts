import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import type { FulfillmentDetails } from '../../domain/entities/fulfillment.entity.js';
import { FulfillmentMode } from '../../domain/enums/fulfillment-mode.enum.js';
import {
  DiningTableReferenceNotFoundError,
  InvalidServiceSetupError,
  RestaurantReferenceNotFoundError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { FULFILLMENT_REPOSITORY } from '../../domain/repositories/fulfillment.repository.js';
import type { FulfillmentRepository } from '../../domain/repositories/fulfillment.repository.js';
import { planAttentionOpening } from '../../domain/services/attention-opening.js';
import type { AttentionOpening } from '../../domain/services/attention-opening.js';
import { ServiceTypesService } from '../attention-settings/service-types.service.js';
import { WorkflowStatusesService } from '../attention-settings/workflow-statuses.service.js';
import { DINING_TABLE_LOOKUP } from '../ports/dining-table-lookup.port.js';
import type { DiningTableLookupPort } from '../ports/dining-table-lookup.port.js';
import { TENANT_LOOKUP } from '../../../common/application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../common/application/ports/tenant-lookup.port.js';
import { generateAttentionNumber } from './attention-number.js';
import { lockAttention } from './require-attention.js';

export type { AttentionOpening };

export interface OpenAttentionInput {
  /** One of the restaurant's service types... */
  serviceTypeId?: string | null;
  /** ...or its first active type of this mode. */
  fulfillmentMode?: FulfillmentMode | null;
  /** Required when the service type requires a table; gives the restaurant. */
  diningTableId?: string;
  /** Required when neither a table nor serviceTypeId identify the restaurant. */
  restaurantId?: string;
  customerUserId?: string | null;
  /** Contact (and delivery) data, required for PICKUP / DELIVERY. */
  fulfillment?: FulfillmentDetails;
}

/** Opening an attention, by staff or as the first step of a diner's order. */
@Injectable()
export class AttentionOpeningService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(FULFILLMENT_REPOSITORY)
    private readonly fulfillmentRepository: FulfillmentRepository,
    @Inject(DINING_TABLE_LOOKUP)
    private readonly diningTableLookup: DiningTableLookupPort,
    @Inject(TENANT_LOOKUP)
    private readonly restaurantLookup: TenantLookup,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly serviceTypes: ServiceTypesService,
    private readonly statuses: WorkflowStatusesService,
  ) {}

  /** Opens a new attention; a table that already has an active one is a conflict. */
  async open(input: OpenAttentionInput): Promise<Attention> {
    const opening = await this.prepareOpening(input);
    return this.transactionRunner.run((tx) => this.saveOpening(opening, tx));
  }

  /**
   * Validates the table, restaurant and service type and builds the
   * attention (see planAttentionOpening); saves nothing.
   */
  async prepareOpening(input: OpenAttentionInput): Promise<AttentionOpening> {
    const table = input.diningTableId
      ? await this.requireOperationalTable(input.diningTableId)
      : null;
    const serviceType = await this.serviceTypes.resolveActive({
      restaurantId: table?.restaurantId ?? input.restaurantId,
      serviceTypeId: input.serviceTypeId,
      fulfillmentMode: input.fulfillmentMode,
    });
    const restaurant = await this.restaurantLookup.findRestaurant(
      serviceType.restaurantId,
    );
    if (!restaurant || !restaurant.isActive) {
      throw new RestaurantReferenceNotFoundError(serviceType.restaurantId);
    }
    const statuses = await this.statuses.attentionCatalog(restaurant.id);
    return planAttentionOpening({
      attentionId: randomUUID(),
      fulfillmentId: randomUUID(),
      attentionNumber: generateAttentionNumber(),
      serviceType,
      status: statuses.initial(),
      table,
      customerUserId: input.customerUserId,
      fulfillment: input.fulfillment,
    });
  }

  /**
   * Saves a prepared attention within the caller's transaction. Throws
   * ActiveAttentionAlreadyExistsError if the table got one concurrently.
   */
  async saveOpening(
    opening: AttentionOpening,
    tx: TransactionContext,
  ): Promise<Attention> {
    const saved = await this.attentionRepository.save(opening.attention, tx);
    if (opening.fulfillment) {
      await this.fulfillmentRepository.save(opening.fulfillment, tx);
    }
    return saved;
  }

  /**
   * Within the caller's transaction: joins the table's active attention
   * (locking it) or saves the prepared one. Pickup and delivery always open
   * their own attention.
   */
  async openOrJoin(
    opening: AttentionOpening,
    tx: TransactionContext,
  ): Promise<Attention> {
    const diningTableId = opening.attention.diningTableId;
    if (diningTableId) {
      const active = await this.attentionRepository.findActiveByDiningTable(
        diningTableId,
        tx,
      );
      if (active) {
        return lockAttention(this.attentionRepository, active.id, tx);
      }
    }
    return this.saveOpening(opening, tx);
  }

  private async requireOperationalTable(diningTableId: string) {
    const table = await this.diningTableLookup.findById(diningTableId);
    if (!table) {
      throw new DiningTableReferenceNotFoundError(diningTableId);
    }
    if (!table.isOperational) {
      throw new InvalidServiceSetupError('La mesa no está activa');
    }
    return table;
  }
}
