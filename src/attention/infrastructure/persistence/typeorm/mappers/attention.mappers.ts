import { AttentionParticipant } from '../../../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../../../domain/entities/fulfillment.entity.js';
import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderItemStatusHistory } from '../../../../domain/entities/order-item-status-history.entity.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { AttentionParticipantOrmEntity } from '../entities/attention-participant.orm-entity.js';
import { AttentionOrmEntity } from '../entities/attention.orm-entity.js';
import { FulfillmentOrmEntity } from '../entities/fulfillment.orm-entity.js';
import { OrderOrmEntity } from '../entities/order.orm-entity.js';
import { OrderItemStatusHistoryOrmEntity } from '../entities/order-item-status-history.orm-entity.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';
import { ServiceType } from '../../../../domain/entities/service-type.entity.js';
import { WorkflowStatus } from '../../../../domain/entities/workflow-status.entity.js';
import type {
  StatusRef,
  WorkflowDefinition,
} from '../../../../domain/workflows.js';
import { ServiceTypeOrmEntity } from '../entities/service-type.orm-entity.js';
import {
  AttentionStatusOrmEntity,
  OrderStatusOrmEntity,
} from '../entities/workflow-status.orm-entity.js';

/**
 * Domain entities carry the canonical state of their status, so the status
 * relation must be loaded (joined) whenever a row is mapped.
 */
function statusRef<C extends string>(
  id: string,
  status: { canonicalState: C } | null | undefined,
): StatusRef<C> {
  if (!status) {
    throw new Error(`Status ${id} was not loaded with its row`);
  }
  return { id, canonicalState: status.canonicalState };
}

/** Keeps the canonical state on the saved row so it maps back without a reload. */
function statusRelation<T>(ref: StatusRef<string>): T {
  return { id: ref.id, canonicalState: ref.canonicalState } as T;
}

export const WORKFLOW_STATUS_RELATIONS = { status: true } as const;

export class AttentionMapper {
  static toDomain(orm: AttentionOrmEntity): Attention {
    return Attention.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      diningTableId: orm.diningTableId,
      customerUserId: orm.customerUserId,
      attentionNumber: orm.attentionNumber,
      serviceTypeId: orm.serviceTypeId,
      fulfillmentMode: serviceTypeOf(orm).fulfillmentMode,
      status: statusRef(orm.attentionStatusId, orm.status),
      billRequestedAt: orm.billRequestedAt,
      openedAt: orm.openedAt,
      closedAt: orm.closedAt,
      cancelledAt: orm.cancelledAt,
      cancellationReason: orm.cancellationReason,
      version: orm.version,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Attention,
    existing?: AttentionOrmEntity,
  ): AttentionOrmEntity {
    const orm = existing ?? new AttentionOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.diningTableId = domain.diningTableId;
    orm.customerUserId = domain.customerUserId;
    orm.attentionNumber = domain.attentionNumber;
    orm.serviceTypeId = domain.serviceTypeId;
    orm.serviceType = {
      id: domain.serviceTypeId,
      fulfillmentMode: domain.fulfillmentMode,
    } as ServiceTypeOrmEntity;
    orm.attentionStatusId = domain.statusId;
    orm.status = statusRelation<AttentionStatusOrmEntity>({
      id: domain.statusId,
      canonicalState: domain.status,
    });
    orm.billRequestedAt = domain.billRequestedAt;
    orm.openedAt = domain.openedAt;
    orm.closedAt = domain.closedAt;
    orm.cancelledAt = domain.cancelledAt;
    orm.cancellationReason = domain.cancellationReason;
    return orm;
  }
}

export class AttentionParticipantMapper {
  static toDomain(orm: AttentionParticipantOrmEntity): AttentionParticipant {
    return AttentionParticipant.fromPersistence({
      id: orm.id,
      attentionId: orm.attentionId,
      userId: orm.userId,
      guestToken: orm.guestToken,
      displayName: orm.displayName,
      joinedAt: orm.joinedAt,
      leftAt: orm.leftAt,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(
    domain: AttentionParticipant,
  ): AttentionParticipantOrmEntity {
    const orm = new AttentionParticipantOrmEntity();
    orm.id = domain.id;
    orm.attentionId = domain.attentionId;
    orm.userId = domain.userId;
    orm.guestToken = domain.guestToken;
    orm.displayName = domain.displayName;
    orm.joinedAt = domain.joinedAt;
    orm.leftAt = domain.leftAt;
    return orm;
  }
}

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    return Order.fromPersistence({
      id: orm.id,
      attentionId: orm.attentionId,
      requestId: orm.requestId,
      source: orm.source,
      submittedByUserId: orm.submittedByUserId,
      submittedByParticipantId: orm.submittedByParticipantId,
      status: statusRef(orm.orderStatusId, orm.status),
      submittedAt: orm.submittedAt,
      confirmedAt: orm.confirmedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Order,
    existing?: OrderOrmEntity,
  ): OrderOrmEntity {
    const orm = existing ?? new OrderOrmEntity();
    orm.id = domain.id;
    orm.attentionId = domain.attentionId;
    orm.requestId = domain.requestId;
    orm.source = domain.source;
    orm.submittedByUserId = domain.submittedByUserId;
    orm.submittedByParticipantId = domain.submittedByParticipantId;
    orm.orderStatusId = domain.statusId;
    orm.status = statusRelation<OrderStatusOrmEntity>({
      id: domain.statusId,
      canonicalState: domain.status,
    });
    orm.submittedAt = domain.submittedAt;
    orm.confirmedAt = domain.confirmedAt;
    return orm;
  }
}

export class OrderItemMapper {
  static toDomain(orm: OrderItemOrmEntity): OrderItem {
    return OrderItem.fromPersistence({
      id: orm.id,
      orderId: orm.orderId,
      productId: orm.productId,
      requestedByParticipantId: orm.requestedByParticipantId,
      productNameSnapshot: orm.productNameSnapshot,
      unitPrice: orm.unitPrice,
      quantity: orm.quantity,
      subtotal: orm.subtotal,
      customerNote: orm.customerNote,
      status: statusRef(orm.orderStatusId, orm.status),
      rejectionReason: orm.rejectionReason,
      version: orm.version,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: OrderItem): OrderItemOrmEntity {
    const orm = new OrderItemOrmEntity();
    orm.id = domain.id;
    orm.orderId = domain.orderId;
    orm.productId = domain.productId;
    orm.requestedByParticipantId = domain.requestedByParticipantId;
    orm.productNameSnapshot = domain.productNameSnapshot;
    orm.unitPrice = domain.unitPrice;
    orm.quantity = domain.quantity;
    orm.subtotal = domain.subtotal;
    orm.customerNote = domain.customerNote;
    orm.orderStatusId = domain.statusId;
    orm.status = statusRelation<OrderStatusOrmEntity>({
      id: domain.statusId,
      canonicalState: domain.currentStatus,
    });
    orm.rejectionReason = domain.rejectionReason;
    return orm;
  }
}

export class OrderItemStatusHistoryMapper {
  static toDomain(
    orm: OrderItemStatusHistoryOrmEntity,
  ): OrderItemStatusHistory {
    return OrderItemStatusHistory.fromPersistence({
      id: orm.id,
      orderItemId: orm.orderItemId,
      previousStatus: orm.previousStatusId
        ? statusRef(orm.previousStatusId, orm.previousStatus)
        : null,
      newStatus: statusRef(orm.newStatusId, orm.newStatus),
      changedByUserId: orm.changedByUserId,
      reason: orm.reason,
      changedAt: orm.changedAt,
      versionBefore: orm.versionBefore,
    });
  }

  static toPersistence(
    domain: OrderItemStatusHistory,
  ): OrderItemStatusHistoryOrmEntity {
    const orm = new OrderItemStatusHistoryOrmEntity();
    orm.id = domain.id;
    orm.orderItemId = domain.orderItemId;
    orm.previousStatusId = domain.previousStatus?.id ?? null;
    orm.previousStatus = domain.previousStatus
      ? statusRelation<OrderStatusOrmEntity>(domain.previousStatus)
      : null;
    orm.newStatusId = domain.newStatus.id;
    orm.newStatus = statusRelation<OrderStatusOrmEntity>(domain.newStatus);
    orm.changedByUserId = domain.changedByUserId;
    orm.reason = domain.reason;
    orm.changedAt = domain.changedAt;
    orm.versionBefore = domain.versionBefore;
    return orm;
  }
}

export class FulfillmentMapper {
  static toDomain(orm: FulfillmentOrmEntity): Fulfillment {
    return Fulfillment.fromPersistence({
      id: orm.id,
      attentionId: orm.attentionId,
      type: orm.type,
      status: orm.status,
      customerName: orm.customerName,
      customerPhone: orm.customerPhone,
      scheduledAt: orm.scheduledAt,
      estimatedReadyAt: orm.estimatedReadyAt,
      deliveryAddress: orm.deliveryAddress,
      deliveryReference: orm.deliveryReference,
      latitude: orm.latitude,
      longitude: orm.longitude,
      deliveryFee: orm.deliveryFee,
      eatAtRestaurant: orm.eatAtRestaurant,
      deliveredAt: orm.deliveredAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: Fulfillment,
    existing?: FulfillmentOrmEntity,
  ): FulfillmentOrmEntity {
    const orm = existing ?? new FulfillmentOrmEntity();
    orm.id = domain.id;
    orm.attentionId = domain.attentionId;
    orm.type = domain.type;
    orm.status = domain.status;
    orm.customerName = domain.customerName;
    orm.customerPhone = domain.customerPhone;
    orm.scheduledAt = domain.scheduledAt;
    orm.estimatedReadyAt = domain.estimatedReadyAt;
    orm.deliveryAddress = domain.deliveryAddress;
    orm.deliveryReference = domain.deliveryReference;
    orm.latitude = domain.latitude;
    orm.longitude = domain.longitude;
    orm.deliveryFee = domain.deliveryFee;
    orm.eatAtRestaurant = domain.eatAtRestaurant;
    orm.deliveredAt = domain.deliveredAt;
    return orm;
  }
}

function serviceTypeOf(orm: AttentionOrmEntity): ServiceTypeOrmEntity {
  if (!orm.serviceType) {
    throw new Error(
      `Service type ${orm.serviceTypeId} was not loaded with its attention`,
    );
  }
  return orm.serviceType;
}

export class WorkflowStatusMapper {
  static toDomain<C extends string>(
    workflow: WorkflowDefinition<C>,
    orm: AttentionStatusOrmEntity | OrderStatusOrmEntity,
  ): WorkflowStatus<C> {
    return WorkflowStatus.fromPersistence(workflow, {
      id: orm.id,
      restaurantId: orm.restaurantId,
      code: orm.code,
      name: orm.name,
      canonicalState: orm.canonicalState as C,
      color: orm.color,
      sortOrder: orm.sortOrder,
      isInitial: orm.isInitial,
      isFinal: orm.isFinal,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence<
    C extends string,
    T extends AttentionStatusOrmEntity | OrderStatusOrmEntity,
  >(domain: WorkflowStatus<C>, orm: T): T {
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.canonicalState = domain.canonicalState as never;
    orm.color = domain.color;
    orm.sortOrder = domain.sortOrder;
    orm.isInitial = domain.isInitial;
    orm.isFinal = domain.isFinal;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class ServiceTypeMapper {
  static toDomain(orm: ServiceTypeOrmEntity): ServiceType {
    return ServiceType.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      code: orm.code,
      name: orm.name,
      fulfillmentMode: orm.fulfillmentMode,
      requiresTable: orm.requiresTable,
      requiresCustomerAddress: orm.requiresCustomerAddress,
      minimumOrderAmount: orm.minimumOrderAmount,
      deliveryFee: orm.deliveryFee,
      sortOrder: orm.sortOrder,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: ServiceType,
    existing?: ServiceTypeOrmEntity,
  ): ServiceTypeOrmEntity {
    const orm = existing ?? new ServiceTypeOrmEntity();
    orm.id = domain.id;
    orm.restaurantId = domain.restaurantId;
    orm.code = domain.code;
    orm.name = domain.name;
    orm.fulfillmentMode = domain.fulfillmentMode;
    orm.requiresTable = domain.requiresTable;
    orm.requiresCustomerAddress = domain.requiresCustomerAddress;
    orm.minimumOrderAmount = domain.minimumOrderAmount;
    orm.deliveryFee = domain.deliveryFee;
    orm.sortOrder = domain.sortOrder;
    orm.isActive = domain.isActive;
    return orm;
  }
}
