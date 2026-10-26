import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import { roundMoney } from '../../../common/domain/value-objects/money.js';
import { AttentionParticipant } from '../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../domain/entities/fulfillment.entity.js';
import type { FulfillmentDetails } from '../../domain/entities/fulfillment.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import { FulfillmentStatus } from '../../domain/enums/fulfillment-status.enum.js';
import { FulfillmentType } from '../../domain/enums/fulfillment-type.enum.js';
import { ServiceType } from '../../domain/enums/service-type.enum.js';
import {
  ActiveAttentionAlreadyExistsError,
  AttentionNotFoundError,
  DiningTableReferenceNotFoundError,
  FulfillmentNotFoundError,
  InvalidServiceSetupError,
  RestaurantReferenceNotFoundError,
  ServiceModeDisabledError,
} from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from '../../domain/repositories/attention-participant.repository.js';
import type { AttentionParticipantRepository } from '../../domain/repositories/attention-participant.repository.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { FULFILLMENT_REPOSITORY } from '../../domain/repositories/fulfillment.repository.js';
import type { FulfillmentRepository } from '../../domain/repositories/fulfillment.repository.js';
import { generateAttentionNumber } from './attention-number.js';
import { OrderItemsService } from '../order-items/order-items.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { DINING_TABLE_LOOKUP } from '../ports/dining-table-lookup.port.js';
import type { DiningTableLookupPort } from '../ports/dining-table-lookup.port.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';
import { RESTAURANT_LOOKUP } from '../ports/restaurant-lookup.port.js';
import type { RestaurantLookupPort } from '../ports/restaurant-lookup.port.js';
import type { Page, PageRequest } from '../../../common/application/pagination.js';

export interface OpenAttentionInput {
  serviceType: ServiceType;
  /** Required for DINE_IN; the restaurant is taken from the table. */
  diningTableId?: string;
  /** Required for PICKUP / DELIVERY. */
  restaurantId?: string;
  customerUserId?: string | null;
  /** Contact and delivery data, required for PICKUP / DELIVERY. */
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
  deliveryFee: number;
  total: number;
  paid: number;
  balance: number;
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
  ) {}

  /** Opens a new attention; a table that already has an active one is a conflict. */
  async open(input: OpenAttentionInput): Promise<Attention> {
    if (input.serviceType === ServiceType.DINE_IN) {
      const table = await this.requireOperationalTable(input.diningTableId);
      await this.requireEnabledMode(table.restaurantId, ServiceType.DINE_IN);
      return this.attentionRepository.save(
        Attention.open({
          id: randomUUID(),
          attentionNumber: generateAttentionNumber(),
          restaurantId: table.restaurantId,
          serviceType: ServiceType.DINE_IN,
          diningTableId: table.id,
          customerUserId: input.customerUserId,
        }),
      );
    }

    if (!input.restaurantId) {
      throw new InvalidServiceSetupError(`${input.serviceType} requiere un restaurante`);
    }
    if (!input.fulfillment) {
      throw new InvalidServiceSetupError(
        `${input.serviceType} requiere datos de contacto (y de entrega)`,
      );
    }
    const restaurant = await this.restaurantLookup.findById(input.restaurantId);
    if (!restaurant || !restaurant.isActive) {
      throw new RestaurantReferenceNotFoundError(input.restaurantId);
    }
    const orderMode = await this.requireEnabledMode(restaurant.id, input.serviceType);
    const attention = Attention.open({
      id: randomUUID(),
      attentionNumber: generateAttentionNumber(),
      restaurantId: restaurant.id,
      serviceType: input.serviceType,
      customerUserId: input.customerUserId,
    });
    const fulfillment = Fulfillment.create({
      ...input.fulfillment,
      id: randomUUID(),
      attentionId: attention.id,
      type:
        input.serviceType === ServiceType.DELIVERY
          ? FulfillmentType.DELIVERY
          : FulfillmentType.PICKUP,
      // The fee is the restaurant's, never the client's.
      deliveryFee:
        input.serviceType === ServiceType.DELIVERY ? (orderMode.deliveryFee ?? 0) : 0,
    });
    return this.transactionRunner.run(async (tx) => {
      const saved = await this.attentionRepository.save(attention, tx);
      await this.fulfillmentRepository.save(fulfillment, tx);
      return saved;
    });
  }

  /**
   * Returns the table's active attention or opens one. Two diners scanning
   * the same QR at once end up in the same attention: the unique index
   * rejects the second insert and we read the winner instead.
   */
  async openOrReuseForTable(diningTableId: string): Promise<Attention> {
    const active = await this.attentionRepository.findActiveByDiningTable(diningTableId);
    if (active) {
      return active;
    }
    try {
      return await this.open({
        serviceType: ServiceType.DINE_IN,
        diningTableId,
      });
    } catch (error) {
      if (error instanceof ActiveAttentionAlreadyExistsError) {
        const winner =
          await this.attentionRepository.findActiveByDiningTable(diningTableId);
        if (winner) {
          return winner;
        }
      }
      throw error;
    }
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
    const attention = await this.findOne(id);
    const [items, fulfillment, paid] = await Promise.all([
      this.itemsService.findByAttention(id),
      this.fulfillmentRepository.findByAttention(id),
      this.paymentLedger.paidAmount(id),
    ]);
    const billable = items.filter((item) => item.isBillable);
    const subtotal = roundMoney(billable.reduce((sum, item) => sum + item.subtotal, 0));
    const deliveryFee = fulfillment?.deliveryFee ?? 0;
    const total = roundMoney(subtotal + deliveryFee);
    return {
      attention,
      items: billable,
      subtotal,
      deliveryFee,
      total,
      paid,
      balance: roundMoney(total - paid),
    };
  }

  async requestBill(id: string): Promise<Attention> {
    const attention = await this.findOne(id);
    attention.requestBill();
    return this.attentionRepository.save(attention);
  }

  async close(id: string): Promise<Attention> {
    const bill = await this.getBill(id);
    bill.attention.close(bill.balance);
    return this.attentionRepository.save(bill.attention);
  }

  /** Cancelling the attention also cancels its pending pickup/delivery. */
  async cancel(id: string, reason: string): Promise<Attention> {
    const attention = await this.findOne(id);
    attention.cancel(reason, await this.paymentLedger.paidAmount(id));
    const fulfillment = await this.fulfillmentRepository.findByAttention(id);
    if (fulfillment && !fulfillment.isFinal) {
      fulfillment.changeStatus(FulfillmentStatus.CANCELLED);
    }
    return this.transactionRunner.run(async (tx) => {
      if (fulfillment) {
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
    const fulfillment = await this.fulfillmentRepository.findByAttention(attentionId);
    if (!fulfillment) {
      throw new FulfillmentNotFoundError(attentionId);
    }
    fulfillment.changeStatus(input.status, {
      estimatedReadyAt: input.estimatedReadyAt,
    });
    return this.fulfillmentRepository.save(fulfillment);
  }

  private async requireEnabledMode(restaurantId: string, serviceType: ServiceType) {
    const orderMode = await this.restaurantLookup.findOrderMode(
      restaurantId,
      serviceType,
    );
    if (!orderMode.isEnabled) {
      throw new ServiceModeDisabledError(serviceType);
    }
    return orderMode;
  }

  private async requireOperationalTable(diningTableId?: string) {
    if (!diningTableId) {
      throw new InvalidServiceSetupError('DINE_IN requiere una mesa');
    }
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
