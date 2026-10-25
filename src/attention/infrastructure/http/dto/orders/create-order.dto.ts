import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../../domain/entities/order-status.enum.js';

export class CreateOrderDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  diningTableId: string;

  @ApiPropertyOptional({ enum: OrderStatus, example: OrderStatus.OPEN })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
