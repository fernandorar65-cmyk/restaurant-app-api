import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { BusinessRuleDomainError } from '../../../common/domain/domain-error.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { AttentionParticipant } from '../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import type { FulfillmentDetails } from '../../domain/entities/fulfillment.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderSource } from '../../domain/enums/order-source.enum.js';
import { OrderItemStatus } from '../../domain/enums/order-item-status.enum.js';
import { ServiceType } from '../../domain/enums/service-type.enum.js';
import {
  ActiveAttentionAlreadyExistsError,
  AttentionAccessDeniedError,
  DuplicateOrderRequestError,
  InvalidServiceSetupError,
  InvalidTableQrTokenError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from '../../domain/repositories/attention-participant.repository.js';
import type { AttentionParticipantRepository } from '../../domain/repositories/attention-participant.repository.js';
import {
  AttentionsService,
  type AttentionBill,
  type AttentionDetail,
  type AttentionOpening,
  type OpenAttentionInput,
} from '../attentions/attentions.service.js';
import { OrderItemsService } from '../order-items/order-items.service.js';
import {
  OrdersService,
  type OrderLineInput,
  type OrderResult,
} from '../orders/orders.service.js';
import type { ProductForOrder } from '../ports/product-lookup.port.js';
import { TABLE_QR_LOOKUP } from '../ports/table-qr-lookup.port.js';
import type { TableQrLookupPort } from '../ports/table-qr-lookup.port.js';

/** Who is calling: a logged-in user, a guest (token), or both unknown yet. */
export interface DinerIdentity {
  userId: string | null;
  guestToken: string | null;
}

export interface StartAttentionInput {
  serviceType: ServiceType;
  /** QR token of the table, required for DINE_IN. */
  tableToken?: string;
  /** Required for PICKUP / DELIVERY. */
  restaurantId?: string;
  requestId: string;
  items: OrderLineInput[];
  displayName?: string | null;
  fulfillment?: FulfillmentDetails;
}

export interface StartAttentionResult {
  attention: Attention;
  participant: AttentionParticipant;
  order: OrderResult;
}

export class ItemAlreadyInPreparationError extends BusinessRuleDomainError {
  constructor() {
    super('El plato ya está en preparación y no se puede cancelar');
  }
}

/**
 * Diner-facing use cases. Every diner at the table is a participant of the
 * same attention; access is granted to participants only.
 */
@Injectable()
export class CustomerAttentionsService {
  constructor(
    @Inject(ATTENTION_PARTICIPANT_REPOSITORY)
    private readonly participantRepository: AttentionParticipantRepository,
    @Inject(TABLE_QR_LOOKUP) private readonly tableQrLookup: TableQrLookupPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly attentionsService: AttentionsService,
    private readonly ordersService: OrdersService,
    private readonly itemsService: OrderItemsService,
  ) {}

  /**
   * First order of a diner: joins (or opens) the table's attention, or opens
   * a pickup/delivery one, registers the diner and submits the order. The
   * cart is validated before anything is saved, and the three writes share
   * one transaction, so a rejected order never leaves an empty attention.
   */
  async start(
    input: StartAttentionInput,
    identity: DinerIdentity,
  ): Promise<StartAttentionResult> {
    const opening = await this.attentionsService.prepareOpening(
      await this.openingInput(input, identity),
    );
    const products = await this.ordersService.validateItems(
      opening.attention,
      input.items,
    );
    try {
      return await this.startInTransaction(opening, products, input, identity);
    } catch (error) {
      // Another diner opened the table's attention (or sent the same order)
      // at the same time: the retry joins theirs.
      if (
        error instanceof ActiveAttentionAlreadyExistsError ||
        error instanceof DuplicateOrderRequestError
      ) {
        return this.startInTransaction(opening, products, input, identity);
      }
      throw error;
    }
  }

  async addOrder(
    attentionId: string,
    identity: DinerIdentity,
    input: { requestId: string; items: OrderLineInput[] },
  ): Promise<OrderResult> {
    const participant = await this.requireParticipant(attentionId, identity);
    return this.ordersService.submitOrder({
      attentionId,
      requestId: input.requestId,
      source: OrderSource.CUSTOMER,
      items: input.items,
      participantId: participant.id,
    });
  }

  /** A diner can cancel their own dishes while the kitchen hasn't started. */
  async cancelItem(
    attentionId: string,
    itemId: string,
    identity: DinerIdentity,
  ): Promise<OrderItem> {
    const participant = await this.requireParticipant(attentionId, identity);
    const item = await this.itemsService.findOne(itemId);
    const order = await this.ordersService.findOrder(item.orderId);
    if (
      order.attentionId !== attentionId ||
      item.requestedByParticipantId !== participant.id
    ) {
      throw new AttentionAccessDeniedError();
    }
    if (item.currentStatus !== OrderItemStatus.SUBMITTED) {
      throw new ItemAlreadyInPreparationError();
    }
    return this.itemsService.changeStatus(itemId, {
      status: OrderItemStatus.CANCELLED,
      expectedVersion: item.version,
      reason: 'Cancelado por el comensal',
    });
  }

  async getDetail(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<AttentionDetail> {
    await this.requireParticipant(attentionId, identity);
    return this.attentionsService.getDetail(attentionId);
  }

  async getBill(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<AttentionBill> {
    await this.requireParticipant(attentionId, identity);
    return this.attentionsService.getBill(attentionId);
  }

  async requestBill(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<Attention> {
    await this.requireParticipant(attentionId, identity);
    return this.attentionsService.requestBill(attentionId);
  }

  private async openingInput(
    input: StartAttentionInput,
    identity: DinerIdentity,
  ): Promise<OpenAttentionInput> {
    if (input.serviceType !== ServiceType.DINE_IN) {
      return {
        serviceType: input.serviceType,
        restaurantId: input.restaurantId,
        customerUserId: identity.userId,
        fulfillment: input.fulfillment,
      };
    }
    if (!input.tableToken) {
      throw new InvalidServiceSetupError('DINE_IN requiere el token del QR de la mesa');
    }
    const table = await this.tableQrLookup.resolveByToken(input.tableToken);
    if (!table) {
      throw new InvalidTableQrTokenError();
    }
    return { serviceType: ServiceType.DINE_IN, diningTableId: table.tableId };
  }

  private async startInTransaction(
    opening: AttentionOpening,
    products: Map<string, ProductForOrder>,
    input: StartAttentionInput,
    identity: DinerIdentity,
  ): Promise<StartAttentionResult> {
    const { attentionId, participant, order } = await this.transactionRunner.run(
      async (tx) => {
        const attention = await this.attentionsService.openOrJoin(opening, tx);
        const participant = await this.joinOrGet(
          attention.id,
          identity,
          input.displayName,
          tx,
        );
        const order = await this.ordersService.placeOrder(
          {
            attentionId: attention.id,
            requestId: input.requestId,
            source: OrderSource.CUSTOMER,
            items: input.items,
            participantId: participant.id,
          },
          products,
          tx,
        );
        return { attentionId: attention.id, participant, order };
      },
    );
    return {
      attention: await this.attentionsService.findOne(attentionId),
      participant,
      order,
    };
  }

  private async joinOrGet(
    attentionId: string,
    identity: DinerIdentity,
    displayName?: string | null,
    tx?: TransactionContext,
  ): Promise<AttentionParticipant> {
    const existing = await this.participantRepository.findByIdentity(
      attentionId,
      identity,
      tx,
    );
    if (existing) {
      return existing;
    }
    // Guests keep their token across orders; a new guest gets a fresh one.
    return this.participantRepository.save(
      AttentionParticipant.join({
        id: randomUUID(),
        attentionId,
        userId: identity.userId,
        guestToken: identity.userId ? null : (identity.guestToken ?? randomUUID()),
        displayName,
      }),
      tx,
    );
  }

  private async requireParticipant(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<AttentionParticipant> {
    await this.attentionsService.findOne(attentionId);
    const participant = await this.participantRepository.findByIdentity(
      attentionId,
      identity,
    );
    if (!participant) {
      throw new AttentionAccessDeniedError();
    }
    return participant;
  }
}
