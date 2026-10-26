import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Page, PageRequest } from '../../../common/application/pagination.js';
import { TRANSACTION_RUNNER } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionRunner } from '../../../common/application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { ProviderEvent } from '../../domain/entities/provider-event.entity.js';
import { normalizeProviderCode } from '../../domain/entities/provider-status-mapping.entity.js';
import { ProviderEventResult } from '../../domain/enums/provider-event-result.enum.js';
import {
  PROVIDER_EVENT_REPOSITORY,
  PROVIDER_STATUS_MAPPING_REPOSITORY,
} from '../../domain/repositories/payment-catalog.repository.js';
import type {
  ProviderEventRepository,
  ProviderStatusMappingRepository,
} from '../../domain/repositories/payment-catalog.repository.js';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.js';
import type { PaymentRepository } from '../../domain/repositories/payment.repository.js';
import { REFUND_STATUSES_DISABLED } from '../payments/payments.service.js';

export interface ProviderEventInput {
  eventId: string;
  eventType: string;
  providerPaymentId?: string | null;
  externalStatus?: string | null;
  payload?: Record<string, unknown>;
}

export interface ProviderEventOutcome {
  event: ProviderEvent;
  /** True when the same event had already been received (nothing was applied). */
  duplicate: boolean;
}

/**
 * Applies gateway notifications to payments, idempotently: each event is
 * stored once (provider + event id), the external status is kept as
 * reported and translated through the active mappings, and statuses that
 * would go backwards (late or repeated webhooks) are ignored.
 */
@Injectable()
export class ProviderEventsService {
  constructor(
    @Inject(PROVIDER_EVENT_REPOSITORY) private readonly eventRepository: ProviderEventRepository,
    @Inject(PROVIDER_STATUS_MAPPING_REPOSITORY)
    private readonly mappingRepository: ProviderStatusMappingRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepository: PaymentRepository,
    @Inject(TRANSACTION_RUNNER) private readonly transactionRunner: TransactionRunner,
  ) {}

  async receive(providerCode: string, input: ProviderEventInput): Promise<ProviderEventOutcome> {
    const code = normalizeProviderCode(providerCode);
    const previous = await this.eventRepository.findByEventId(code, input.eventId);
    if (previous) {
      return { event: previous, duplicate: true };
    }
    const event = ProviderEvent.receive({ id: randomUUID(), providerCode: code, ...input });
    const stored = await this.transactionRunner.run(async (tx) => {
      if (!(await this.eventRepository.insertIfNew(event, tx))) {
        return false;
      }
      await this.apply(event, tx);
      await this.eventRepository.save(event, tx);
      return true;
    });
    if (!stored) {
      const winner = await this.eventRepository.findByEventId(code, input.eventId);
      return { event: winner ?? event, duplicate: true };
    }
    return { event, duplicate: false };
  }

  findPage(filter: { providerCode?: string }, page: PageRequest): Promise<Page<ProviderEvent>> {
    return this.eventRepository.findPage(
      { providerCode: filter.providerCode && normalizeProviderCode(filter.providerCode) },
      page,
    );
  }

  private async apply(event: ProviderEvent, tx: TransactionContext): Promise<void> {
    if (!event.providerPaymentId || !event.externalStatus) {
      event.finish(ProviderEventResult.IGNORED, 'El evento no trae el pago o su estado');
      return;
    }
    const found = await this.paymentRepository.findByProviderPaymentId(
      event.providerCode,
      event.providerPaymentId,
      tx,
    );
    const payment = found && (await this.paymentRepository.findByIdForUpdate(found.id, tx));
    if (!payment) {
      event.finish(ProviderEventResult.IGNORED, 'No hay un pago con ese identificador del proveedor');
      return;
    }
    payment.recordProviderStatus(event.externalStatus);
    const mapping = await this.mappingRepository.find(event.providerCode, event.externalStatus);
    let result: ProviderEventResult;
    let message: string;
    if (!mapping?.isActive) {
      result = ProviderEventResult.FAILED;
      message = `El estado "${event.externalStatus}" no tiene un mapeo activo`;
    } else if (REFUND_STATUSES_DISABLED.includes(mapping.paymentStatus)) {
      result = ProviderEventResult.IGNORED;
      message = 'Los reembolsos aún no están habilitados';
    } else if (!payment.canMoveTo(mapping.paymentStatus)) {
      result = ProviderEventResult.IGNORED;
      message = `El pago está en ${payment.status}; no vuelve a ${mapping.paymentStatus}`;
    } else {
      const changed = payment.changeStatus(mapping.paymentStatus);
      result = ProviderEventResult.PROCESSED;
      message = changed
        ? `El pago pasó a ${payment.status}`
        : `El pago ya estaba en ${payment.status}`;
    }
    await this.paymentRepository.updateStatus(payment, tx);
    event.finish(result, message, payment.id);
  }
}
