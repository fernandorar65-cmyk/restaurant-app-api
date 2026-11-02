import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AttentionBill,
  AttentionDetail,
  AttentionVisit,
} from '../../../application/attentions/attention-queries.service.js';
import { AttentionParticipant } from '../../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../../domain/entities/fulfillment.entity.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderItemStatusHistory } from '../../../domain/entities/order-item-status-history.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { AttentionStatus } from '../../../domain/enums/attention-status.enum.js';
import { FulfillmentStatus } from '../../../domain/enums/fulfillment-status.enum.js';
import { FulfillmentType } from '../../../domain/enums/fulfillment-type.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { FulfillmentMode } from '../../../domain/enums/fulfillment-mode.enum.js';
import type { BulkStatusChangeResult } from '../../../application/order-items/order-items.service.js';
import type { TimelineEvent } from '../../../domain/services/timeline.js';

export class AttentionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  diningTableId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  customerUserId: string | null;

  @ApiProperty({ example: 'A-7KX2QF' })
  attentionNumber: string;

  @ApiProperty()
  serviceTypeId: string;

  @ApiProperty({ enum: FulfillmentMode })
  fulfillmentMode: FulfillmentMode;

  @ApiProperty({ enum: AttentionStatus, description: 'Estado canónico' })
  status: AttentionStatus;

  @ApiProperty({
    description:
      'Estado de la sede (nombre y color en GET /attention-statuses)',
  })
  statusId: string;

  @ApiPropertyOptional({ type: Date, nullable: true })
  billRequestedAt: Date | null;

  @ApiProperty()
  openedAt: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  closedAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  cancelledAt: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  cancellationReason: string | null;

  @ApiProperty()
  version: number;

  static fromDomain(attention: Attention): AttentionResponseDto {
    const dto = new AttentionResponseDto();
    dto.id = attention.id;
    dto.restaurantId = attention.restaurantId;
    dto.diningTableId = attention.diningTableId;
    dto.customerUserId = attention.customerUserId;
    dto.attentionNumber = attention.attentionNumber;
    dto.serviceTypeId = attention.serviceTypeId;
    dto.fulfillmentMode = attention.fulfillmentMode;
    dto.status = attention.status;
    dto.statusId = attention.statusId;
    dto.billRequestedAt = attention.billRequestedAt;
    dto.openedAt = attention.openedAt;
    dto.closedAt = attention.closedAt;
    dto.cancelledAt = attention.cancelledAt;
    dto.cancellationReason = attention.cancellationReason;
    dto.version = attention.version;
    return dto;
  }
}

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  requestedByParticipantId: string | null;

  @ApiProperty({ description: 'Nombre del producto al momento del pedido' })
  productName: string;

  @ApiProperty({ description: 'Precio al momento del pedido' })
  unitPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  customerNote: string | null;

  @ApiProperty({ enum: OrderStatus, description: 'Estado canónico' })
  status: OrderStatus;

  @ApiProperty({
    description: 'Estado de la sede (nombre y color en GET /order-statuses)',
  })
  statusId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  rejectionReason: string | null;

  @ApiProperty({
    description: 'Enviar en el cambio de estado (concurrencia optimista)',
  })
  version: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(item: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();
    dto.id = item.id;
    dto.orderId = item.orderId;
    dto.productId = item.productId;
    dto.requestedByParticipantId = item.requestedByParticipantId;
    dto.productName = item.productNameSnapshot;
    dto.unitPrice = item.unitPrice;
    dto.quantity = item.quantity;
    dto.subtotal = item.subtotal;
    dto.customerNote = item.customerNote;
    dto.status = item.currentStatus;
    dto.statusId = item.statusId;
    dto.rejectionReason = item.rejectionReason;
    dto.version = item.version;
    dto.createdAt = item.createdAt;
    dto.updatedAt = item.updatedAt;
    return dto;
  }
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  attentionId: string;

  @ApiProperty()
  requestId: string;

  @ApiProperty({ enum: OrderSource })
  source: OrderSource;

  @ApiPropertyOptional({ type: String, nullable: true })
  submittedByUserId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  submittedByParticipantId: string | null;

  @ApiProperty({ enum: OrderStatus, description: 'Estado canónico' })
  status: OrderStatus;

  @ApiProperty()
  statusId: string;

  @ApiProperty()
  submittedAt: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  static fromDomain(order: Order, items: OrderItem[]): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.attentionId = order.attentionId;
    dto.requestId = order.requestId;
    dto.source = order.source;
    dto.submittedByUserId = order.submittedByUserId;
    dto.submittedByParticipantId = order.submittedByParticipantId;
    dto.status = order.status;
    dto.statusId = order.statusId;
    dto.submittedAt = order.submittedAt;
    dto.confirmedAt = order.confirmedAt;
    dto.items = items
      .filter((item) => item.orderId === order.id)
      .map((item) => OrderItemResponseDto.fromDomain(item));
    return dto;
  }
}

export class ParticipantResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  displayName: string | null;

  @ApiProperty()
  joinedAt: Date;

  static fromDomain(participant: AttentionParticipant): ParticipantResponseDto {
    const dto = new ParticipantResponseDto();
    dto.id = participant.id;
    dto.userId = participant.userId;
    dto.displayName = participant.displayName;
    dto.joinedAt = participant.joinedAt;
    return dto;
  }
}

export class FulfillmentResponseDto {
  @ApiProperty({ enum: FulfillmentType })
  type: FulfillmentType;

  @ApiProperty({ enum: FulfillmentStatus })
  status: FulfillmentStatus;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  customerPhone: string;

  @ApiPropertyOptional({ type: Date, nullable: true })
  scheduledAt: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  deliveryAddress: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  deliveryReference: string | null;

  @ApiProperty()
  deliveryFee: number;

  @ApiPropertyOptional({ type: Date, nullable: true })
  estimatedReadyAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deliveredAt: Date | null;

  static fromDomain(fulfillment: Fulfillment): FulfillmentResponseDto {
    const dto = new FulfillmentResponseDto();
    dto.type = fulfillment.type;
    dto.status = fulfillment.status;
    dto.customerName = fulfillment.customerName;
    dto.customerPhone = fulfillment.customerPhone;
    dto.scheduledAt = fulfillment.scheduledAt;
    dto.deliveryAddress = fulfillment.deliveryAddress;
    dto.deliveryReference = fulfillment.deliveryReference;
    dto.deliveryFee = fulfillment.deliveryFee;
    dto.estimatedReadyAt = fulfillment.estimatedReadyAt;
    dto.deliveredAt = fulfillment.deliveredAt;
    return dto;
  }
}

export class AttentionDetailResponseDto extends AttentionResponseDto {
  @ApiProperty({ type: [ParticipantResponseDto] })
  participants: ParticipantResponseDto[];

  @ApiProperty({
    type: [OrderResponseDto],
    description: 'Rondas con sus platos y el estado de cada uno',
  })
  orders: OrderResponseDto[];

  @ApiPropertyOptional({ type: FulfillmentResponseDto, nullable: true })
  fulfillment: FulfillmentResponseDto | null;

  @ApiPropertyOptional({
    description:
      'Solo al registrar a un invitado: guárdalo y envíalo como X-Guest-Token',
  })
  guestToken?: string;

  static fromDetail(detail: AttentionDetail): AttentionDetailResponseDto {
    const dto = Object.assign(
      new AttentionDetailResponseDto(),
      AttentionResponseDto.fromDomain(detail.attention),
    );
    dto.participants = detail.participants.map((participant) =>
      ParticipantResponseDto.fromDomain(participant),
    );
    dto.orders = detail.orders.map((order) =>
      OrderResponseDto.fromDomain(order, detail.items),
    );
    dto.fulfillment = detail.fulfillment
      ? FulfillmentResponseDto.fromDomain(detail.fulfillment)
      : null;
    return dto;
  }
}

export class AttentionBillResponseDto {
  @ApiProperty()
  attentionId: string;

  @ApiProperty({ enum: AttentionStatus })
  status: AttentionStatus;

  @ApiProperty({
    type: [OrderItemResponseDto],
    description: 'Solo ítems cobrables (sin rechazados ni cancelados)',
  })
  items: OrderItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ description: 'Pagos confirmados menos reembolsos' })
  paid: number;

  @ApiProperty()
  balance: number;

  static fromBill(bill: AttentionBill): AttentionBillResponseDto {
    const dto = new AttentionBillResponseDto();
    dto.attentionId = bill.attention.id;
    dto.status = bill.attention.status;
    dto.items = bill.items.map((item) => OrderItemResponseDto.fromDomain(item));
    dto.subtotal = bill.subtotal;
    dto.deliveryFee = bill.deliveryFee;
    dto.total = bill.total;
    dto.paid = bill.paid;
    dto.balance = bill.balance;
    return dto;
  }
}

export class OrderItemHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ enum: OrderStatus, nullable: true })
  previousStatus: OrderStatus | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  previousStatusId: string | null;

  @ApiProperty({ enum: OrderStatus })
  newStatus: OrderStatus;

  @ApiProperty()
  newStatusId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  changedByUserId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  reason: string | null;

  @ApiProperty()
  changedAt: Date;

  @ApiPropertyOptional({ type: Number, nullable: true })
  versionBefore: number | null;

  static fromDomain(
    entry: OrderItemStatusHistory,
  ): OrderItemHistoryResponseDto {
    const dto = new OrderItemHistoryResponseDto();
    dto.id = entry.id;
    dto.previousStatus = entry.previousStatus?.canonicalState ?? null;
    dto.previousStatusId = entry.previousStatus?.id ?? null;
    dto.newStatus = entry.newStatus.canonicalState;
    dto.newStatusId = entry.newStatus.id;
    dto.changedByUserId = entry.changedByUserId;
    dto.reason = entry.reason;
    dto.changedAt = entry.changedAt;
    dto.versionBefore = entry.versionBefore;
    return dto;
  }
}

class TableQrRestaurantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;
}

class TableQrTableDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'M01' })
  code: string;

  @ApiProperty({ example: 'Mesa 1' })
  name: string;
}

export class TableQrResolveResponseDto {
  @ApiProperty({ type: TableQrRestaurantDto })
  restaurant: TableQrRestaurantDto;

  @ApiProperty({ type: TableQrTableDto })
  table: TableQrTableDto;

  @ApiPropertyOptional({ type: AttentionResponseDto, nullable: true })
  activeAttention: AttentionResponseDto | null;
}

export class VisitRestaurantDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Sabores Miraflores' })
  name: string;

  @ApiProperty({ example: 'sabores-miraflores' })
  slug: string;
}

export class AttentionVisitResponseDto {
  @ApiProperty({ type: AttentionResponseDto })
  attention: AttentionResponseDto;

  @ApiPropertyOptional({ type: VisitRestaurantDto, nullable: true })
  restaurant: VisitRestaurantDto | null;

  @ApiProperty({
    type: [OrderItemResponseDto],
    description: 'Productos cobrables de la visita',
  })
  items: OrderItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  balance: number;

  static fromVisit(visit: AttentionVisit): AttentionVisitResponseDto {
    const dto = new AttentionVisitResponseDto();
    dto.attention = AttentionResponseDto.fromDomain(visit.attention);
    dto.restaurant = visit.restaurant;
    dto.items = visit.items.map((item) =>
      OrderItemResponseDto.fromDomain(item),
    );
    dto.total = visit.total;
    dto.paid = visit.paid;
    dto.balance = visit.balance;
    return dto;
  }
}

export class TimelineEventResponseDto {
  @ApiProperty({
    enum: [
      'ATTENTION_OPENED',
      'ORDER_SUBMITTED',
      'ORDER_CONFIRMED',
      'ITEM_STATUS_CHANGED',
      'BILL_REQUESTED',
      'ATTENTION_CLOSED',
      'ATTENTION_CANCELLED',
    ],
  })
  type: string;

  @ApiProperty()
  at: Date;

  @ApiPropertyOptional({ type: String, nullable: true })
  orderId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  orderItemId: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Lomo saltado',
  })
  productName: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Estado canónico anterior del plato',
  })
  fromStatus: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Estado canónico nuevo del plato',
  })
  toStatus: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Estado de la sede (nombre y color en GET /order-statuses)',
  })
  toStatusId: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Quién envió la orden o cambió el plato',
  })
  userId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  reason: string | null;

  static fromDomain(event: TimelineEvent): TimelineEventResponseDto {
    return Object.assign(new TimelineEventResponseDto(), event);
  }
}

export class BulkStatusFailureDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'STALE_ORDER_ITEM_VERSION' })
  errorCode: string;

  @ApiProperty()
  message: string;
}

export class BulkStatusChangeResponseDto {
  @ApiProperty({ type: [OrderItemResponseDto] })
  updated: OrderItemResponseDto[];

  @ApiProperty({ type: [BulkStatusFailureDto] })
  failed: BulkStatusFailureDto[];

  static fromResult(
    result: BulkStatusChangeResult,
  ): BulkStatusChangeResponseDto {
    const dto = new BulkStatusChangeResponseDto();
    dto.updated = result.updated.map((item) =>
      OrderItemResponseDto.fromDomain(item),
    );
    dto.failed = result.failed;
    return dto;
  }
}
