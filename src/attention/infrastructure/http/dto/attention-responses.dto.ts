import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AttentionBill,
  AttentionDetail,
} from '../../../application/attentions/attentions.service.js';
import { AttentionParticipant } from '../../../domain/entities/attention-participant.entity.js';
import { Attention } from '../../../domain/entities/attention.entity.js';
import { Fulfillment } from '../../../domain/entities/fulfillment.entity.js';
import { OrderBatch } from '../../../domain/entities/order-batch.entity.js';
import { OrderItemStatusHistory } from '../../../domain/entities/order-item-status-history.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { AttentionStatus } from '../../../domain/enums/attention-status.enum.js';
import { FulfillmentStatus } from '../../../domain/enums/fulfillment-status.enum.js';
import { FulfillmentType } from '../../../domain/enums/fulfillment-type.enum.js';
import { OrderBatchSource } from '../../../domain/enums/order-batch-source.enum.js';
import { OrderBatchStatus } from '../../../domain/enums/order-batch-status.enum.js';
import { OrderItemStatus } from '../../../domain/enums/order-item-status.enum.js';
import { ServiceType } from '../../../domain/enums/service-type.enum.js';

export class AttentionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiPropertyOptional({ nullable: true })
  diningTableId: string | null;

  @ApiPropertyOptional({ nullable: true })
  customerUserId: string | null;

  @ApiProperty({ example: 'A-7KX2QF' })
  attentionNumber: string;

  @ApiProperty({ enum: ServiceType })
  serviceType: ServiceType;

  @ApiProperty({ enum: AttentionStatus })
  status: AttentionStatus;

  @ApiPropertyOptional({ nullable: true })
  billRequestedAt: Date | null;

  @ApiProperty()
  openedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  closedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
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
    dto.serviceType = attention.serviceType;
    dto.status = attention.status;
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
  batchId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  requestedByParticipantId: string | null;

  @ApiProperty({ description: 'Nombre del producto al momento del pedido' })
  productName: string;

  @ApiProperty({ description: 'Precio al momento del pedido' })
  unitPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional({ nullable: true })
  customerNote: string | null;

  @ApiProperty({ enum: OrderItemStatus })
  status: OrderItemStatus;

  @ApiPropertyOptional({ nullable: true })
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
    dto.batchId = item.batchId;
    dto.productId = item.productId;
    dto.requestedByParticipantId = item.requestedByParticipantId;
    dto.productName = item.productNameSnapshot;
    dto.unitPrice = item.unitPrice;
    dto.quantity = item.quantity;
    dto.subtotal = item.subtotal;
    dto.customerNote = item.customerNote;
    dto.status = item.currentStatus;
    dto.rejectionReason = item.rejectionReason;
    dto.version = item.version;
    dto.createdAt = item.createdAt;
    dto.updatedAt = item.updatedAt;
    return dto;
  }
}

export class OrderBatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  attentionId: string;

  @ApiProperty()
  requestId: string;

  @ApiProperty({ enum: OrderBatchSource })
  source: OrderBatchSource;

  @ApiPropertyOptional({ nullable: true })
  submittedByUserId: string | null;

  @ApiPropertyOptional({ nullable: true })
  submittedByParticipantId: string | null;

  @ApiProperty({ enum: OrderBatchStatus })
  status: OrderBatchStatus;

  @ApiProperty()
  submittedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  static fromDomain(batch: OrderBatch, items: OrderItem[]): OrderBatchResponseDto {
    const dto = new OrderBatchResponseDto();
    dto.id = batch.id;
    dto.attentionId = batch.attentionId;
    dto.requestId = batch.requestId;
    dto.source = batch.source;
    dto.submittedByUserId = batch.submittedByUserId;
    dto.submittedByParticipantId = batch.submittedByParticipantId;
    dto.status = batch.status;
    dto.submittedAt = batch.submittedAt;
    dto.confirmedAt = batch.confirmedAt;
    dto.items = items
      .filter((item) => item.batchId === batch.id)
      .map((item) => OrderItemResponseDto.fromDomain(item));
    return dto;
  }
}

export class ParticipantResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ nullable: true })
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

  @ApiPropertyOptional({ nullable: true })
  scheduledAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryAddress: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryReference: string | null;

  @ApiProperty()
  deliveryFee: number;

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
    return dto;
  }
}

export class AttentionDetailResponseDto extends AttentionResponseDto {
  @ApiProperty({ type: [ParticipantResponseDto] })
  participants: ParticipantResponseDto[];

  @ApiProperty({
    type: [OrderBatchResponseDto],
    description: 'Rondas con sus platos y el estado de cada uno',
  })
  rounds: OrderBatchResponseDto[];

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
    dto.rounds = detail.batches.map((batch) =>
      OrderBatchResponseDto.fromDomain(batch, detail.items),
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

  @ApiPropertyOptional({ enum: OrderItemStatus, nullable: true })
  previousStatus: OrderItemStatus | null;

  @ApiProperty({ enum: OrderItemStatus })
  newStatus: OrderItemStatus;

  @ApiPropertyOptional({ nullable: true })
  changedByUserId: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason: string | null;

  @ApiProperty()
  changedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  versionBefore: number | null;

  static fromDomain(entry: OrderItemStatusHistory): OrderItemHistoryResponseDto {
    const dto = new OrderItemHistoryResponseDto();
    dto.id = entry.id;
    dto.previousStatus = entry.previousStatus;
    dto.newStatus = entry.newStatus;
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
