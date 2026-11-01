import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { AttentionParticipant } from '../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import type { FulfillmentDetails } from '../../domain/entities/fulfillment.entity.js';
import { FulfillmentMode } from '../../domain/enums/fulfillment-mode.enum.js';
import { OrderSource } from '../../domain/enums/order-source.enum.js';
import {
  ActiveAttentionAlreadyExistsError,
  DuplicateOrderRequestError,
  InvalidServiceSetupError,
  InvalidTableQrTokenError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from '../../domain/repositories/attention-participant.repository.js';
import type { AttentionParticipantRepository } from '../../domain/repositories/attention-participant.repository.js';
import {
  AttentionOpeningService,
  type AttentionOpening,
  type OpenAttentionInput,
} from '../attentions/attention-opening.service.js';
import { AttentionQueriesService } from '../attentions/attention-queries.service.js';
import {
  OrderSubmissionService,
  type OrderLineInput,
  type OrderResult,
} from '../orders/order-submission.service.js';
import type { ProductForOrder } from '../ports/product-lookup.port.js';
import { TABLE_QR_LOOKUP } from '../ports/table-qr-lookup.port.js';
import type { TableQrLookupPort } from '../ports/table-qr-lookup.port.js';
import type { DinerIdentity } from './customer-attentions.service.js';

export interface StartAttentionInput {
  /** One of the restaurant's service types... */
  serviceTypeId?: string | null;
  /** ...or its first active type of this mode. */
  fulfillmentMode?: FulfillmentMode | null;
  /** QR token of the table, required when the service type requires a table. */
  tableToken?: string;
  /** Required for pickup / delivery unless serviceTypeId identifies the restaurant. */
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

/**
 * A diner's first order: joins (or opens) the table's attention, or opens a
 * pickup/delivery one, and registers the diner as a participant.
 */
@Injectable()
export class DinerAttentionStartService {
  constructor(
    @Inject(ATTENTION_PARTICIPANT_REPOSITORY)
    private readonly participantRepository: AttentionParticipantRepository,
    @Inject(TABLE_QR_LOOKUP) private readonly tableQrLookup: TableQrLookupPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly opening: AttentionOpeningService,
    private readonly queries: AttentionQueriesService,
    private readonly submission: OrderSubmissionService,
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
    const opening = await this.opening.prepareOpening(
      await this.openingInput(input, identity),
    );
    const products = await this.submission.validateItems(
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

  private async openingInput(
    input: StartAttentionInput,
    identity: DinerIdentity,
  ): Promise<OpenAttentionInput> {
    const base = {
      serviceTypeId: input.serviceTypeId,
      fulfillmentMode: input.fulfillmentMode,
    };
    if (!input.tableToken) {
      if (
        input.fulfillmentMode === FulfillmentMode.DINE_IN &&
        !input.serviceTypeId
      ) {
        throw new InvalidServiceSetupError(
          'En mesa requiere el token del QR de la mesa',
        );
      }
      return {
        ...base,
        restaurantId: input.restaurantId,
        customerUserId: identity.userId,
        fulfillment: input.fulfillment,
      };
    }
    const table = await this.tableQrLookup.resolveByToken(input.tableToken);
    if (!table) {
      throw new InvalidTableQrTokenError();
    }
    // At a table the default is the restaurant's dine-in service.
    return {
      serviceTypeId: input.serviceTypeId,
      fulfillmentMode: input.fulfillmentMode ?? FulfillmentMode.DINE_IN,
      diningTableId: table.tableId,
    };
  }

  private async startInTransaction(
    opening: AttentionOpening,
    products: Map<string, ProductForOrder>,
    input: StartAttentionInput,
    identity: DinerIdentity,
  ): Promise<StartAttentionResult> {
    const { attentionId, participant, order } =
      await this.transactionRunner.run(async (tx) => {
        const attention = await this.opening.openOrJoin(opening, tx);
        const participant = await this.joinOrGet(
          attention.id,
          identity,
          input.displayName,
          tx,
        );
        const order = await this.submission.placeOrder(
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
      });
    return {
      attention: await this.queries.findOne(attentionId),
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
        guestToken: identity.userId
          ? null
          : (identity.guestToken ?? randomUUID()),
        displayName,
      }),
      tx,
    );
  }
}
