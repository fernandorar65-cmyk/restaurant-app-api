import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { FulfillmentType } from '../../../../domain/entities/fulfillment-type.enum.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';

class CustomerOrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty()
  roundNumber: number;
}

export class CustomerOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'A-0142' })
  code: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  total: number;

  @ApiProperty({ enum: FulfillmentType })
  fulfillmentType: FulfillmentType;

  @ApiPropertyOptional({ nullable: true })
  diningTableId: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryAddress: string | null;

  @ApiPropertyOptional({ nullable: true })
  billRequestedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Solo viene en la respuesta de creación cuando no hay login',
  })
  guestToken?: string;

  @ApiProperty({ type: [CustomerOrderItemDto] })
  items: CustomerOrderItemDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(
    order: Order,
    items: OrderItem[],
    includeGuestToken: boolean,
  ): CustomerOrderResponseDto {
    const dto = new CustomerOrderResponseDto();
    dto.id = order.id;
    dto.code = order.code;
    dto.status = order.status;
    dto.total = order.total;
    dto.fulfillmentType = order.fulfillmentType;
    dto.diningTableId = order.diningTableId;
    dto.deliveryAddress = order.deliveryAddress;
    dto.billRequestedAt = order.billRequestedAt;
    dto.guestToken = includeGuestToken ? (order.guestToken ?? undefined) : undefined;
    dto.items = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes,
      roundNumber: item.roundNumber,
    }));
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    return dto;
  }
}
