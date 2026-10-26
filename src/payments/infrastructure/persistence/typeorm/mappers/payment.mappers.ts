import { Payment } from '../../../../domain/entities/payment.entity.js';
import { PaymentStatus } from '../../../../domain/entities/payment-status.entity.js';
import { ProviderEvent } from '../../../../domain/entities/provider-event.entity.js';
import { ProviderStatusMapping } from '../../../../domain/entities/provider-status-mapping.entity.js';
import type { PaymentStatusCode } from '../../../../domain/enums/payment-status-code.enum.js';
import { PaymentAllocationOrmEntity } from '../entities/payment-allocation.orm-entity.js';
import { PaymentProviderEventOrmEntity } from '../entities/payment-provider-event.orm-entity.js';
import { PaymentProviderStatusMappingOrmEntity } from '../entities/payment-provider-status-mapping.orm-entity.js';
import { PaymentStatusOrmEntity } from '../entities/payment-status.orm-entity.js';
import { PaymentOrmEntity } from '../entities/payment.orm-entity.js';

export class PaymentMapper {
  static toDomain(orm: PaymentOrmEntity): Payment {
    return Payment.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      restaurantId: orm.restaurantId,
      attentionId: orm.attentionId,
      status: orm.status.code as PaymentStatusCode,
      method: orm.paymentMethod,
      mode: orm.allocationMode,
      amount: orm.amount,
      currencyCode: orm.currencyCode,
      payerUserId: orm.payerUserId,
      payerName: orm.payerName,
      externalReference: orm.externalReference,
      provider: orm.providerCode
        ? {
            code: orm.providerCode,
            paymentId: orm.providerPaymentId,
            status: orm.providerStatus,
          }
        : null,
      requestId: orm.requestId,
      notes: orm.notes,
      paidAt: orm.paidAt,
      registeredByUserId: orm.registeredByUserId,
      allocations: (orm.allocations ?? [])
        .map((allocation) => ({
          id: allocation.id,
          concept: allocation.concept,
          orderItemId: allocation.orderItemId,
          amount: allocation.allocatedAmount,
          createdAt: allocation.createdAt,
        }))
        // Products first, then the delivery fee (same order as the planner).
        .sort(
          (a, b) =>
            a.concept.localeCompare(b.concept) ||
            (a.orderItemId ?? '').localeCompare(b.orderItemId ?? ''),
        ),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  /** statusId resolves the internal status code to its catalog row. */
  static toPersistence(domain: Payment, statusId: string): PaymentOrmEntity {
    const orm = new PaymentOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.restaurantId = domain.restaurantId;
    orm.attentionId = domain.attentionId;
    orm.paymentStatusId = statusId;
    orm.paymentMethod = domain.method;
    orm.allocationMode = domain.mode;
    orm.amount = domain.amount;
    orm.currencyCode = domain.currencyCode;
    orm.payerUserId = domain.payerUserId;
    orm.payerName = domain.payerName;
    orm.externalReference = domain.externalReference;
    orm.providerCode = domain.provider?.code ?? null;
    orm.providerPaymentId = domain.provider?.paymentId ?? null;
    orm.providerStatus = domain.provider?.status ?? null;
    orm.requestId = domain.requestId;
    orm.notes = domain.notes;
    orm.paidAt = domain.paidAt;
    orm.registeredByUserId = domain.registeredByUserId;
    return orm;
  }

  static allocationsToPersistence(domain: Payment): PaymentAllocationOrmEntity[] {
    return domain.allocations.map((allocation) => {
      const orm = new PaymentAllocationOrmEntity();
      orm.id = allocation.id;
      orm.paymentId = domain.id;
      orm.concept = allocation.concept;
      orm.orderItemId = allocation.orderItemId;
      orm.allocatedAmount = allocation.amount;
      return orm;
    });
  }
}

export class PaymentStatusMapper {
  static toDomain(orm: PaymentStatusOrmEntity): PaymentStatus {
    return PaymentStatus.fromPersistence({
      id: orm.id,
      code: orm.code as PaymentStatusCode,
      name: orm.name,
      description: orm.description,
      isTerminal: orm.isTerminal,
      countsTowardBalance: orm.countsTowardBalance,
      allowsRefund: orm.allowsRefund,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}

export class ProviderStatusMappingMapper {
  static toDomain(orm: PaymentProviderStatusMappingOrmEntity): ProviderStatusMapping {
    return ProviderStatusMapping.fromPersistence({
      id: orm.id,
      providerCode: orm.providerCode,
      externalStatus: orm.externalStatus,
      paymentStatus: orm.paymentStatus.code as PaymentStatusCode,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}

export class ProviderEventMapper {
  static toDomain(orm: PaymentProviderEventOrmEntity): ProviderEvent {
    return ProviderEvent.fromPersistence({
      id: orm.id,
      providerCode: orm.providerCode,
      eventId: orm.eventId,
      eventType: orm.eventType,
      providerPaymentId: orm.providerPaymentId,
      externalStatus: orm.externalStatus,
      payload: orm.payload,
      paymentId: orm.paymentId,
      receivedAt: orm.receivedAt,
      processedAt: orm.processedAt,
      result: orm.result,
      resultMessage: orm.resultMessage,
    });
  }

  static toPersistence(domain: ProviderEvent): PaymentProviderEventOrmEntity {
    const orm = new PaymentProviderEventOrmEntity();
    orm.id = domain.id;
    orm.providerCode = domain.providerCode;
    orm.eventId = domain.eventId;
    orm.eventType = domain.eventType;
    orm.providerPaymentId = domain.providerPaymentId;
    orm.externalStatus = domain.externalStatus;
    orm.payload = domain.payload;
    orm.paymentId = domain.paymentId;
    orm.receivedAt = domain.receivedAt;
    orm.processedAt = domain.processedAt;
    orm.result = domain.result;
    orm.resultMessage = domain.resultMessage;
    return orm;
  }
}
