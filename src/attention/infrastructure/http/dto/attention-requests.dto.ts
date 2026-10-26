import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FulfillmentStatus } from '../../../domain/enums/fulfillment-status.enum.js';
import { OrderItemStatus } from '../../../domain/enums/order-item-status.enum.js';
import { ServiceType } from '../../../domain/enums/service-type.enum.js';

export class OrderLineDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Sin cebolla' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string | null;
}

export class SubmitOrderDto {
  @ApiProperty({
    example: '0b6f8c1e-3c1a-4b8e-9d6a-2f1e7c9a5b10',
    description:
      'UUID generado por el cliente para esta orden. Reenviarlo no duplica productos',
  })
  @IsUUID()
  requestId: string;

  @ApiProperty({ type: [OrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];
}

export class WaiterOrderDto extends SubmitOrderDto {
  @ApiPropertyOptional({ description: 'Mozo que registra la orden' })
  @IsOptional()
  @IsUUID()
  submittedByUserId?: string | null;
}

export class FulfillmentDto {
  @ApiProperty({ example: 'Ana Torres' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  customerName: string;

  @ApiProperty({ example: '+51 999 999 999' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  customerPhone: string;

  @ApiPropertyOptional({ description: 'Hora programada de recojo/entrega' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date | null;

  @ApiPropertyOptional({
    example: 'Av. Larco 123, Miraflores',
    description: 'Requerido en DELIVERY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string | null;

  @ApiPropertyOptional({ example: 'Puerta verde, 3er piso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryReference?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'PICKUP: comerá en el local' })
  @IsOptional()
  @IsBoolean()
  eatAtRestaurant?: boolean | null;
}

export class OpenAttentionDto {
  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ description: 'Requerido en DINE_IN' })
  @IsOptional()
  @IsUUID()
  diningTableId?: string;

  @ApiPropertyOptional({ description: 'Requerido en PICKUP / DELIVERY' })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiPropertyOptional({ description: 'Comensal registrado titular de la cuenta' })
  @IsOptional()
  @IsUUID()
  customerUserId?: string | null;

  @ApiPropertyOptional({
    type: FulfillmentDto,
    description: 'Requerido en PICKUP / DELIVERY',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FulfillmentDto)
  fulfillment?: FulfillmentDto;
}

export class CancelAttentionDto {
  @ApiProperty({ example: 'El cliente se retiró' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'La mesa cambió de pedido' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

export class ChangeOrderItemStatusDto {
  @ApiProperty({ enum: OrderItemStatus })
  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;

  @ApiPropertyOptional({
    description:
      'Versión leída del ítem. Si otro empleado lo cambió antes, responde 409 en lugar de sobrescribir',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  version?: number;

  @ApiPropertyOptional({ description: 'Obligatorio para REJECTED' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  changedByUserId?: string | null;
}

export class ChangeFulfillmentStatusDto {
  @ApiProperty({
    enum: FulfillmentStatus,
    description:
      'PENDING→CONFIRMED→PREPARING→READY→(PICKUP: COMPLETED | DELIVERY: OUT_FOR_DELIVERY→COMPLETED); CANCELLED desde cualquier estado no final',
  })
  @IsEnum(FulfillmentStatus)
  status: FulfillmentStatus;

  @ApiPropertyOptional({ description: 'Hora estimada de listo (útil al confirmar)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  estimatedReadyAt?: Date | null;
}

export class StartCustomerAttentionDto extends SubmitOrderDto {
  @ApiProperty({ enum: ServiceType, example: ServiceType.DINE_IN })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({
    description: 'Token del QR de la mesa. Requerido en DINE_IN',
  })
  @IsOptional()
  @IsString()
  tableToken?: string;

  @ApiPropertyOptional({ description: 'Requerido en PICKUP / DELIVERY' })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiPropertyOptional({
    example: 'Ana',
    description: 'Cómo verán al comensal en la mesa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string | null;

  @ApiPropertyOptional({
    type: FulfillmentDto,
    description: 'Requerido en PICKUP / DELIVERY',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FulfillmentDto)
  fulfillment?: FulfillmentDto;
}
