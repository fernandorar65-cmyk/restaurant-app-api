import { Inject, Injectable } from '@nestjs/common';
import type {
  Page,
  PageRequest,
} from '../../../common/domain/pagination.js';
import { AttentionParticipant } from '../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../domain/entities/fulfillment.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { AttentionStatus } from '../../domain/enums/attention-status.enum.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from '../../domain/repositories/attention-participant.repository.js';
import type { AttentionParticipantRepository } from '../../domain/repositories/attention-participant.repository.js';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type { AttentionRepository } from '../../domain/repositories/attention.repository.js';
import { FULFILLMENT_REPOSITORY } from '../../domain/repositories/fulfillment.repository.js';
import type { FulfillmentRepository } from '../../domain/repositories/fulfillment.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type { OrderItemRepository } from '../../domain/repositories/order-item.repository.js';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { computeBill } from '../../domain/services/bill.js';
import type { Bill } from '../../domain/services/bill.js';
import { PAYMENT_LEDGER } from '../ports/payment-ledger.port.js';
import type { PaymentLedgerPort } from '../ports/payment-ledger.port.js';
import { requireAttention } from './require-attention.js';

export interface AttentionDetail {
  attention: Attention;
  participants: AttentionParticipant[];
  orders: Order[];
  items: OrderItem[];
  fulfillment: Fulfillment | null;
}

export interface AttentionBill extends Bill {
  attention: Attention;
}

/** Read side of attentions: listings, detail and what is owed. */
@Injectable()
export class AttentionQueriesService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ATTENTION_PARTICIPANT_REPOSITORY)
    private readonly participantRepository: AttentionParticipantRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
    @Inject(FULFILLMENT_REPOSITORY)
    private readonly fulfillmentRepository: FulfillmentRepository,
    @Inject(PAYMENT_LEDGER) private readonly paymentLedger: PaymentLedgerPort,
  ) {}

  findPage(
    filter: { restaurantId?: string; status?: AttentionStatus },
    page: PageRequest,
  ): Promise<Page<Attention>> {
    return this.attentionRepository.findPage(filter, page);
  }

  findActiveByTable(diningTableId: string): Promise<Attention | null> {
    return this.attentionRepository.findActiveByDiningTable(diningTableId);
  }

  findOne(id: string): Promise<Attention> {
    return requireAttention(this.attentionRepository, id);
  }

  async getDetail(id: string): Promise<AttentionDetail> {
    const attention = await this.findOne(id);
    const [participants, orders, items, fulfillment] = await Promise.all([
      this.participantRepository.findByAttention(id),
      this.orderRepository.findByAttention(id),
      this.itemRepository.findByAttention(id),
      this.fulfillmentRepository.findByAttention(id),
    ]);
    return { attention, participants, orders, items, fulfillment };
  }

  /** Rejected and cancelled items are never charged. */
  async getBill(id: string): Promise<AttentionBill> {
    return this.billFor(await this.findOne(id));
  }

  /**
   * What the attention owes right now. Inside a transaction that locked the
   * attention, an order placed concurrently is either included or rejected.
   */
  async billFor(attention: Attention): Promise<AttentionBill> {
    const [items, fulfillment, paid] = await Promise.all([
      this.itemRepository.findByAttention(attention.id),
      this.fulfillmentRepository.findByAttention(attention.id),
      this.paymentLedger.paidAmount(attention.id),
    ]);
    return { attention, ...computeBill({ items, fulfillment, paid }) };
  }
}
