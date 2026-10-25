import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';

export class CreateOrderStatusHistoryDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PROGRESS })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'El platillo entró a cocina' })
  @IsOptional()
  @IsString()
  notes?: string;
}
