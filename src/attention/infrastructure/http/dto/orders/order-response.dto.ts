import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../../../../domain/entities/order.entity.js';
import { FulfillmentType } from '../../../../domain/entities/fulfillment-type.enum.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';

export class OrderResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'A-0142' })
  code: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.OPEN })
  status: OrderStatus;

  @ApiProperty({ example: 0 })
  total: number;

  @ApiProperty({ enum: FulfillmentType, example: FulfillmentType.DINE_IN })
  fulfillmentType: FulfillmentType;

  @ApiPropertyOptional({ nullable: true })
  diningTableId: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryAddress: string | null;

  @ApiPropertyOptional({ nullable: true })
  customerId: string | null;

  @ApiPropertyOptional({ nullable: true })
  billRequestedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.code = order.code;
    dto.status = order.status;
    dto.total = order.total;
    dto.fulfillmentType = order.fulfillmentType;
    dto.diningTableId = order.diningTableId;
    dto.deliveryAddress = order.deliveryAddress;
    dto.customerId = order.customerId;
    dto.billRequestedAt = order.billRequestedAt;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    return dto;
  }
}
