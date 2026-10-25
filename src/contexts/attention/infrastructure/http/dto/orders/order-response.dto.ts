import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';

export class OrderResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.OPEN })
  status: OrderStatus;

  @ApiProperty({ example: 0 })
  total: number;

  @ApiProperty()
  diningTableId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.status = order.status;
    dto.total = order.total;
    dto.diningTableId = order.diningTableId;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    return dto;
  }
}
