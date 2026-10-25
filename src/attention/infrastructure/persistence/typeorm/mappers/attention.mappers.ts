import { AttentionParticipant } from '../../../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../../../domain/entities/fulfillment.entity.js';
import { OrderBatch } from '../../../../domain/entities/order-batch.entity.js';
import { OrderItemStatusHistory } from '../../../../domain/entities/order-item-status-history.entity.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { AttentionParticipantOrmEntity } from '../entities/attention-participant.orm-entity.js';
import { AttentionOrmEntity } from '../entities/attention.orm-entity.js';
import { FulfillmentOrmEntity } from '../entities/fulfillment.orm-entity.js';
import { OrderBatchOrmEntity } from '../entities/order-batch.orm-entity.js';
import { OrderItemStatusHistoryOrmEntity } from '../entities/order-item-status-history.orm-entity.js';
import { OrderItemOrmEntity } from '../entities/order-item.orm-entity.js';

export class AttentionMapper {
  static toDomain(orm: AttentionOrmEntity): Attention {
    return Attention.fromPersistence({
      id: orm.id,
      restaurantId: orm.restaurantId,
      diningTableId: orm.diningTableId,
      customerUserId: orm.customerUserId,
      attentionNumber: orm.attentionNumber,
      serviceType: orm.serviceType,
      status: orm.status,
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
    orm.serviceType = domain.serviceType;
    orm.status = domain.status;
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

  static toPersistence(domain: AttentionParticipant): AttentionParticipantOrmEntity {
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

export class OrderBatchMapper {
  static toDomain(orm: OrderBatchOrmEntity): OrderBatch {
    return OrderBatch.fromPersistence({
      id: orm.id,
      attentionId: orm.attentionId,
      requestId: orm.requestId,
      source: orm.source,
      submittedByUserId: orm.submittedByUserId,
      submittedByParticipantId: orm.submittedByParticipantId,
      status: orm.status,
      submittedAt: orm.submittedAt,
      confirmedAt: orm.confirmedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: OrderBatch,
    existing?: OrderBatchOrmEntity,
  ): OrderBatchOrmEntity {
    const orm = existing ?? new OrderBatchOrmEntity();
    orm.id = domain.id;
    orm.attentionId = domain.attentionId;
    orm.requestId = domain.requestId;
    orm.source = domain.source;
    orm.submittedByUserId = domain.submittedByUserId;
    orm.submittedByParticipantId = domain.submittedByParticipantId;
    orm.status = domain.status;
    orm.submittedAt = domain.submittedAt;
    orm.confirmedAt = domain.confirmedAt;
    return orm;
  }
}

export class OrderItemMapper {
  static toDomain(orm: OrderItemOrmEntity): OrderItem {
    return OrderItem.fromPersistence({
      id: orm.id,
      batchId: orm.batchId,
      productId: orm.productId,
      requestedByParticipantId: orm.requestedByParticipantId,
      productNameSnapshot: orm.productNameSnapshot,
      unitPrice: orm.unitPrice,
      quantity: orm.quantity,
      subtotal: orm.subtotal,
      customerNote: orm.customerNote,
      currentStatus: orm.currentStatus,
      rejectionReason: orm.rejectionReason,
      version: orm.version,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: OrderItem): OrderItemOrmEntity {
    const orm = new OrderItemOrmEntity();
    orm.id = domain.id;
    orm.batchId = domain.batchId;
    orm.productId = domain.productId;
    orm.requestedByParticipantId = domain.requestedByParticipantId;
    orm.productNameSnapshot = domain.productNameSnapshot;
    orm.unitPrice = domain.unitPrice;
    orm.quantity = domain.quantity;
    orm.subtotal = domain.subtotal;
    orm.customerNote = domain.customerNote;
    orm.currentStatus = domain.currentStatus;
    orm.rejectionReason = domain.rejectionReason;
    return orm;
  }
}

export class OrderItemStatusHistoryMapper {
  static toDomain(orm: OrderItemStatusHistoryOrmEntity): OrderItemStatusHistory {
    return OrderItemStatusHistory.fromPersistence({
      id: orm.id,
      orderItemId: orm.orderItemId,
      previousStatus: orm.previousStatus,
      newStatus: orm.newStatus,
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
    orm.previousStatus = domain.previousStatus;
    orm.newStatus = domain.newStatus;
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
