import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';

export class OrderItemResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 12.5 })
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Sin cebolla' })
  notes: string | null;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(orderItem: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();
    dto.id = orderItem.id;
    dto.quantity = orderItem.quantity;
    dto.unitPrice = orderItem.unitPrice;
    dto.notes = orderItem.notes;
    dto.orderId = orderItem.orderId;
    dto.productId = orderItem.productId;
    dto.userId = orderItem.userId;
    dto.createdAt = orderItem.createdAt;
    dto.updatedAt = orderItem.updatedAt;
    return dto;
  }
}
