import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
import { FulfillmentMode } from '../../../domain/enums/fulfillment-mode.enum.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';

export class OrderLineDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ type: String, example: 'Sin cebolla' })
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
  @ApiPropertyOptional({
    type: String,
    description: 'Mozo que registra la orden',
  })
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

  @ApiPropertyOptional({
    type: Date,
    description: 'Hora programada de recojo/entrega',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Av. Larco 123, Miraflores',
    description: 'Requerido en DELIVERY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string | null;

  @ApiPropertyOptional({ type: String, example: 'Puerta verde, 3er piso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryReference?: string | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsLatitude()
  latitude?: number | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsLongitude()
  longitude?: number | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'PICKUP: comerá en el local',
  })
  @IsOptional()
  @IsBoolean()
  eatAtRestaurant?: boolean | null;
}

export class OpenAttentionDto {
  @ApiPropertyOptional({
    description:
      'Tipo de servicio de la sede (GET /service-types). Alternativa a fulfillmentMode',
  })
  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @ApiPropertyOptional({
    enum: FulfillmentMode,
    description:
      'Usa el primer tipo de servicio activo de la sede con esta modalidad',
  })
  @IsOptional()
  @IsEnum(FulfillmentMode)
  fulfillmentMode?: FulfillmentMode;

  @ApiPropertyOptional({
    description: 'Requerido si el tipo de servicio exige mesa',
  })
  @IsOptional()
  @IsUUID()
  diningTableId?: string;

  @ApiPropertyOptional({ description: 'Requerido sin mesa ni serviceTypeId' })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Comensal registrado titular de la cuenta',
  })
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
  @ApiPropertyOptional({
    description:
      'Estado de la sede (GET /order-statuses). Alternativa a status',
  })
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description:
      'Usa el primer estado activo de la sede con este estado canónico',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description:
      'Versión leída del ítem. Si otro empleado lo cambió antes, responde 409 en lugar de sobrescribir',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  version?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Obligatorio para REJECTED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;

  @ApiPropertyOptional({
    description: 'Quién hizo el cambio, para el historial',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  changedByUserId?: string | null;
}

export class BulkStatusItemDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description:
      'Versión leída del plato; si cambió, ese plato falla con 409 y los demás siguen',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  version?: number;
}

export class BulkChangeOrderItemStatusDto {
  @ApiProperty({ description: 'Sede de todos los platos' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ type: [BulkStatusItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BulkStatusItemDto)
  items: BulkStatusItemDto[];

  @ApiPropertyOptional({
    description: 'Estado de la sede. Alternativa a status',
  })
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    type: String,
    description: 'Obligatorio para REJECTED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}

export class ChangeFulfillmentStatusDto {
  @ApiProperty({
    enum: FulfillmentStatus,
    description:
      'PENDING→CONFIRMED→PREPARING→READY→(PICKUP: COMPLETED | DELIVERY: OUT_FOR_DELIVERY→COMPLETED); CANCELLED desde cualquier estado no final',
  })
  @IsEnum(FulfillmentStatus)
  status: FulfillmentStatus;

  @ApiPropertyOptional({
    type: Date,
    description: 'Hora estimada de listo (útil al confirmar)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  estimatedReadyAt?: Date | null;
}

export class StartCustomerAttentionDto extends SubmitOrderDto {
  @ApiPropertyOptional({
    description:
      'Tipo de servicio de la sede (GET /service-types). Alternativa a fulfillmentMode',
  })
  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @ApiPropertyOptional({
    enum: FulfillmentMode,
    description:
      'Usa el primer tipo de servicio activo de la sede con esta modalidad',
  })
  @IsOptional()
  @IsEnum(FulfillmentMode)
  fulfillmentMode?: FulfillmentMode;

  @ApiPropertyOptional({
    description:
      'Token del QR de la mesa. Requerido si el tipo de servicio exige mesa',
  })
  @IsOptional()
  @IsString()
  tableToken?: string;

  @ApiPropertyOptional({ description: 'Requerido sin mesa ni serviceTypeId' })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiPropertyOptional({
    type: String,
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
