import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { AttentionParticipant } from '../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../domain/entities/fulfillment.entity.js';
import type { FulfillmentDetails } from '../../domain/entities/fulfillment.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import { FulfillmentStatus } from '../../domain/enums/fulfillment-status.enum.js';
import { FulfillmentMode } from '../../domain/enums/fulfillment-mode.enum.js';
import { FulfillmentType } from '../../domain/enums/fulfillment-type.enum.js';
import {
  AttentionNotFoundError,
  DiningTableReferenceNotFoundError,
  FulfillmentNotFoundError,
  InvalidServiceSetupError,
  RestaurantReferenceNotFoundError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from '../../domain/repositories/attention-participant.repository.js';
import type { AttentionParticipantRepository } from '../../domain/repositories/attention-participant.repository.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { FULFILLMENT_REPOSITORY } from '../../domain/repositories/fulfillment.repository.js';
import type { FulfillmentRepository } from '../../domain/repositories/fulfillment.repository.js';
import { ServiceTypesService } from '../attention-settings/service-types.service.js';
import { WorkflowStatusesService } from '../attention-settings/workflow-statuses.service.js';
import { generateAttentionNumber } from './attention-number.js';
import { OrderItemsService } from '../order-items/order-items.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { DINING_TABLE_LOOKUP } from '../ports/dining-table-lookup.port.js';
import type { DiningTableLookupPort } from '../ports/dining-table-lookup.port.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import type {
  Page,
  PageRequest,
} from '../../../common/application/pagination.js';

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

export interface AttentionDetail {
  attention: Attention;
  participants: AttentionParticipant[];
  orders: Order[];
  items: OrderItem[];
  fulfillment: Fulfillment | null;
}

export interface AttentionBill {
  attention: Attention;
  items: OrderItem[];
  subtotal: number;
  /** Pickup/delivery record the fee belongs to (null when there is none). */
  fulfillmentId: string | null;
  deliveryFee: number;
  total: number;
  paid: number;
  balance: number;
}

/**
 * A validated attention ready to be saved, together with its pickup/delivery
 * data. Preparing runs the lookups; saving it is left to a transaction.
 */
export interface AttentionOpening {
  attention: Attention;
  fulfillment: Fulfillment | null;
}

@Injectable()
export class AttentionsService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ATTENTION_PARTICIPANT_REPOSITORY)
    private readonly participantRepository: AttentionParticipantRepository,
    @Inject(FULFILLMENT_REPOSITORY)
    private readonly fulfillmentRepository: FulfillmentRepository,
    @Inject(DINING_TABLE_LOOKUP)
    private readonly diningTableLookup: DiningTableLookupPort,
    @Inject(RESTAURANT_LOOKUP)
    private readonly restaurantLookup: RestaurantLookupPort,
    @Inject(PAYMENT_LEDGER) private readonly paymentLedger: PaymentLedgerPort,
    @Inject(TRANSACTION_RUNNER)
    private readonly transactionRunner: TransactionRunner,
    private readonly ordersService: OrdersService,
    private readonly itemsService: OrderItemsService,
    private readonly serviceTypes: ServiceTypesService,
    private readonly statuses: WorkflowStatusesService,
  ) {}

  /** Opens a new attention; a table that already has an active one is a conflict. */
  async open(input: OpenAttentionInput): Promise<Attention> {
    const opening = await this.prepareOpening(input);
    return this.transactionRunner.run((tx) => this.saveOpening(opening, tx));
  }

  /**
   * Validates the table, restaurant and service type; saves nothing. The
   * service type decides: a table when it requires one (and none otherwise),
   * contact data for pickup/delivery and an address when it requires one.
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
    if (table && table.restaurantId !== serviceType.restaurantId) {
      throw new InvalidServiceSetupError(
        'La mesa no pertenece a la sede del tipo de servicio',
      );
    }
    const restaurant = await this.restaurantLookup.findById(
      serviceType.restaurantId,
    );
    if (!restaurant || !restaurant.isActive) {
      throw new RestaurantReferenceNotFoundError(serviceType.restaurantId);
    }
    const statuses = await this.statuses.attentionCatalog(restaurant.id);
    const attention = Attention.open({
      id: randomUUID(),
      attentionNumber: generateAttentionNumber(),
      restaurantId: restaurant.id,
      serviceType: serviceType.ref,
      status: statuses.initial(),
      diningTableId: table?.id ?? null,
      customerUserId: input.customerUserId,
    });
    if (serviceType.fulfillmentMode === FulfillmentMode.DINE_IN) {
      return { attention, fulfillment: null };
    }

    if (!input.fulfillment) {
      throw new InvalidServiceSetupError(
        `${serviceType.name} requiere datos de contacto (y de entrega)`,
      );
    }
    if (
      serviceType.requiresCustomerAddress &&
      !input.fulfillment.deliveryAddress?.trim()
    ) {
      throw new InvalidServiceSetupError(
        `${serviceType.name} requiere la dirección de entrega`,
      );
    }
    const fulfillment = Fulfillment.create({
      ...input.fulfillment,
      id: randomUUID(),
      attentionId: attention.id,
      type:
        serviceType.fulfillmentMode === FulfillmentMode.DELIVERY
          ? FulfillmentType.DELIVERY
          : FulfillmentType.PICKUP,
      // The fee is the restaurant's, never the client's.
      deliveryFee: serviceType.deliveryFee,
    });
    return { attention, fulfillment };
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
        return this.lockActive(active.id, tx);
      }
    }
    return this.saveOpening(opening, tx);
  }

  findPage(
    filter: { restaurantId?: string; status?: AttentionStatus },
    page: PageRequest,
  ): Promise<Page<Attention>> {
    return this.attentionRepository.findPage(filter, page);
  }

  findActiveByTable(diningTableId: string): Promise<Attention | null> {
    return this.attentionRepository.findActiveByDiningTable(diningTableId);
  }

  async findOne(id: string): Promise<Attention> {
    const attention = await this.attentionRepository.findById(id);
    if (!attention) {
      throw new AttentionNotFoundError(id);
    }
    return attention;
  }

  async getDetail(id: string): Promise<AttentionDetail> {
    const attention = await this.findOne(id);
    const [participants, orders, items, fulfillment] = await Promise.all([
      this.participantRepository.findByAttention(id),
      this.ordersService.findOrders(id),
      this.itemsService.findByAttention(id),
      this.fulfillmentRepository.findByAttention(id),
    ]);
    return { attention, participants, orders, items, fulfillment };
  }

  /** Rejected and cancelled items are never charged. */
  async getBill(id: string): Promise<AttentionBill> {
    return this.billFor(await this.findOne(id));
  }

  async requestBill(id: string): Promise<Attention> {
    return this.transactionRunner.run(async (tx) => {
      const attention = await this.lockActive(id, tx);
      const statuses = await this.statuses.attentionCatalog(
        attention.restaurantId,
        tx,
      );
      attention.requestBill(
        statuses.defaultFor(AttentionStatus.BILL_REQUESTED),
      );
      return this.attentionRepository.save(attention, tx);
    });
  }

  /**
   * The balance is computed after taking the lock, so an order placed
   * concurrently is either included or rejected because the attention closed.
   */
  async close(id: string): Promise<Attention> {
    return this.transactionRunner.run(async (tx) => {
      const attention = await this.lockActive(id, tx);
      const bill = await this.billFor(attention);
      const statuses = await this.statuses.attentionCatalog(
        attention.restaurantId,
        tx,
      );
      attention.close(
        bill.balance,
        statuses.defaultFor(AttentionStatus.CLOSED),
      );
      return this.attentionRepository.save(attention, tx);
    });
  }

  /** Cancelling the attention also cancels its pending pickup/delivery. */
  async cancel(id: string, reason: string): Promise<Attention> {
    return this.transactionRunner.run(async (tx) => {
      const attention = await this.lockActive(id, tx);
      const statuses = await this.statuses.attentionCatalog(
        attention.restaurantId,
        tx,
      );
      attention.cancel(
        reason,
        await this.paymentLedger.paidAmount(id),
        statuses.defaultFor(AttentionStatus.CANCELLED),
      );
      const fulfillment = await this.fulfillmentRepository.findByAttention(id);
      if (fulfillment && !fulfillment.isFinal) {
        fulfillment.changeStatus(FulfillmentStatus.CANCELLED);
        await this.fulfillmentRepository.save(fulfillment, tx);
      }
      return this.attentionRepository.save(attention, tx);
    });
  }

  /** Moves the pickup/delivery through its flow (see Fulfillment). */
  async changeFulfillmentStatus(
    attentionId: string,
    input: { status: FulfillmentStatus; estimatedReadyAt?: Date | null },
  ): Promise<Fulfillment> {
    await this.findOne(attentionId);
    const fulfillment =
      await this.fulfillmentRepository.findByAttention(attentionId);
    if (!fulfillment) {
      throw new FulfillmentNotFoundError(attentionId);
    }
    fulfillment.changeStatus(input.status, {
      estimatedReadyAt: input.estimatedReadyAt,
    });
    return this.fulfillmentRepository.save(fulfillment);
  }

  /** Locks the attention row until the transaction ends. */
  private async lockActive(
    id: string,
    tx: TransactionContext,
  ): Promise<Attention> {
    const attention = await this.attentionRepository.findByIdForUpdate(id, tx);
    if (!attention) {
      throw new AttentionNotFoundError(id);
    }
    return attention;
  }

  private async billFor(attention: Attention): Promise<AttentionBill> {
    const [items, fulfillment, paid] = await Promise.all([
      this.itemsService.findByAttention(attention.id),
      this.fulfillmentRepository.findByAttention(attention.id),
      this.paymentLedger.paidAmount(attention.id),
    ]);
    const billable = items.filter((item) => item.isBillable);
    const subtotal = roundMoney(
      billable.reduce((sum, item) => sum + item.subtotal, 0),
    );
    const deliveryFee = fulfillment?.deliveryFee ?? 0;
    const total = roundMoney(subtotal + deliveryFee);
    return {
      attention,
      items: billable,
      subtotal,
      fulfillmentId: fulfillment?.id ?? null,
      deliveryFee,
      total,
      paid,
      balance: roundMoney(total - paid),
    };
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
