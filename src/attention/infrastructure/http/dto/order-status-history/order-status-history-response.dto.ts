import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatusHistory } from '../../../../domain/entities/order-status-history.entity.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';

export class OrderStatusHistoryResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PROGRESS })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'El platillo entró a cocina' })
  notes: string | null;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(
    entry: OrderStatusHistory,
  ): OrderStatusHistoryResponseDto {
    const dto = new OrderStatusHistoryResponseDto();
    dto.id = entry.id;
    dto.status = entry.status;
    dto.notes = entry.notes;
    dto.orderId = entry.orderId;
    dto.createdAt = entry.createdAt;
    dto.updatedAt = entry.updatedAt;
    return dto;
  }
}
