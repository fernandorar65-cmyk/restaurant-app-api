import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleDomainError } from '../../../common/domain/domain-error.js';
import { AttentionParticipant } from '../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../domain/entities/attention.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { OrderSource } from '../../domain/enums/order-source.enum.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { AttentionAccessDeniedError } from '../../domain/exceptions/attention.errors.js';
import { ATTENTION_PARTICIPANT_REPOSITORY } from '../../domain/repositories/attention-participant.repository.js';
import type { AttentionParticipantRepository } from '../../domain/repositories/attention-participant.repository.js';
import { AttentionLifecycleService } from '../attentions/attention-lifecycle.service.js';
import {
  AttentionQueriesService,
  type AttentionBill,
  type AttentionDetail,
} from '../attentions/attention-queries.service.js';
import { OrderItemsService } from '../order-items/order-items.service.js';
import {
  OrderSubmissionService,
  type OrderLineInput,
  type OrderResult,
} from '../orders/order-submission.service.js';
import { OrdersService } from '../orders/orders.service.js';

/** Who is calling: a logged-in user, a guest (token), or both unknown yet. */
export interface DinerIdentity {
  userId: string | null;
  guestToken: string | null;
}

export class ItemAlreadyInPreparationError extends BusinessRuleDomainError {
  constructor() {
    super('El plato ya está en preparación y no se puede cancelar');
  }
}

/**
 * What a diner does on an attention they joined (see DinerAttentionStartService).
 * Every diner at the table is a participant of the same attention; access is
 * granted to participants only.
 */
@Injectable()
export class CustomerAttentionsService {
  constructor(
    @Inject(ATTENTION_PARTICIPANT_REPOSITORY)
    private readonly participantRepository: AttentionParticipantRepository,
    private readonly lifecycle: AttentionLifecycleService,
    private readonly queries: AttentionQueriesService,
    private readonly submission: OrderSubmissionService,
    private readonly ordersService: OrdersService,
    private readonly itemsService: OrderItemsService,
  ) {}

  async addOrder(
    attentionId: string,
    identity: DinerIdentity,
    input: { requestId: string; items: OrderLineInput[] },
  ): Promise<OrderResult> {
    const participant = await this.requireParticipant(attentionId, identity);
    return this.submission.submitOrder({
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
    if (item.currentStatus !== OrderStatus.SUBMITTED) {
      throw new ItemAlreadyInPreparationError();
    }
    return this.itemsService.changeStatus(itemId, {
      status: OrderStatus.CANCELLED,
      expectedVersion: item.version,
      reason: 'Cancelado por el comensal',
    });
  }

  async getDetail(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<AttentionDetail> {
    await this.requireParticipant(attentionId, identity);
    return this.queries.getDetail(attentionId);
  }

  async getBill(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<AttentionBill> {
    await this.requireParticipant(attentionId, identity);
    return this.queries.getBill(attentionId);
  }

  async requestBill(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<Attention> {
    await this.requireParticipant(attentionId, identity);
    return this.lifecycle.requestBill(attentionId);
  }

  private async requireParticipant(
    attentionId: string,
    identity: DinerIdentity,
  ): Promise<AttentionParticipant> {
    await this.queries.findOne(attentionId);
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
