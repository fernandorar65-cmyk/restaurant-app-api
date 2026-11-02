import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ServiceType } from '../../../domain/entities/service-type.entity.js';
import type { WorkflowStatus } from '../../../domain/entities/workflow-status.entity.js';
import { AttentionStatus } from '../../../domain/enums/attention-status.enum.js';
import { FulfillmentMode } from '../../../domain/enums/fulfillment-mode.enum.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';

const CODE = /^[A-Za-z][A-Za-z0-9_]*$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;

class WorkflowStatusFieldsDto {
  @ApiPropertyOptional({ type: String, example: '#D97706', nullable: true })
  @IsOptional()
  @Matches(COLOR)
  color?: string | null;

  @ApiPropertyOptional({
    description: 'true lo vuelve el estado inicial (el anterior deja de serlo)',
  })
  @IsOptional()
  @IsBoolean()
  isInitial?: boolean;
}

export class CreateAttentionStatusDto extends WorkflowStatusFieldsDto {
  @ApiProperty({ description: 'Sede dueña del estado' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ example: 'ESPERANDO_PAGO' })
  @IsString()
  @Matches(CODE)
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Esperando pago' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    enum: AttentionStatus,
    description: 'Lo que el backend hace con este estado; no se puede cambiar',
  })
  @IsEnum(AttentionStatus)
  canonicalState: AttentionStatus;
}

export class CreateOrderStatusDto extends WorkflowStatusFieldsDto {
  @ApiProperty({ description: 'Sede dueña del estado' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ example: 'EN_HORNO' })
  @IsString()
  @Matches(CODE)
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'En horno' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 35 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    enum: OrderStatus,
    description: 'Lo que el backend hace con este estado; no se puede cambiar',
  })
  @IsEnum(OrderStatus)
  canonicalState: OrderStatus;
}

export class UpdateWorkflowStatusDto extends WorkflowStatusFieldsDto {
  @ApiPropertyOptional({ example: 'EN_HORNO', description: 'Único por sede' })
  @IsOptional()
  @IsString()
  @Matches(CODE)
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({ example: 'En horno' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description:
      'false lo desactiva (los registros que lo usan lo conservan). No aplica al estado inicial ni al último activo de su estado canónico',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WorkflowStatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Estado canónico con el que opera el backend' })
  canonicalState: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  color: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isInitial: boolean;

  @ApiProperty()
  isFinal: boolean;

  @ApiProperty()
  isActive: boolean;

  static fromDomain(status: WorkflowStatus<string>): WorkflowStatusResponseDto {
    const dto = new WorkflowStatusResponseDto();
    dto.id = status.id;
    dto.restaurantId = status.restaurantId;
    dto.code = status.code;
    dto.name = status.name;
    dto.canonicalState = status.canonicalState;
    dto.color = status.color;
    dto.sortOrder = status.sortOrder;
    dto.isInitial = status.isInitial;
    dto.isFinal = status.isFinal;
    dto.isActive = status.isActive;
    return dto;
  }
}

class ServiceTypeFieldsDto {
  @ApiPropertyOptional({ description: 'Solo DINE_IN' })
  @IsOptional()
  @IsBoolean()
  requiresTable?: boolean;

  @ApiPropertyOptional({ description: 'Solo DELIVERY' })
  @IsOptional()
  @IsBoolean()
  requiresCustomerAddress?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumOrderAmount?: number;

  @ApiPropertyOptional({ example: 7.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee?: number;
}

export class CreateServiceTypeDto extends ServiceTypeFieldsDto {
  @ApiProperty({ description: 'Sede que ofrece el tipo de servicio' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ example: 'DELIVERY_PROPIO' })
  @IsString()
  @Matches(CODE)
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Delivery propio' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    enum: FulfillmentMode,
    description: 'Reglas que aplica el backend; no se puede cambiar',
  })
  @IsEnum(FulfillmentMode)
  fulfillmentMode: FulfillmentMode;
}

export class UpdateServiceTypeDto extends ServiceTypeFieldsDto {
  @ApiPropertyOptional({
    example: 'DELIVERY_PROPIO',
    description: 'Único por sede',
  })
  @IsOptional()
  @IsString()
  @Matches(CODE)
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({ example: 'Delivery propio' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'false lo retira; las atenciones que lo usaron lo conservan',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ServiceTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FulfillmentMode })
  fulfillmentMode: FulfillmentMode;

  @ApiProperty()
  requiresTable: boolean;

  @ApiProperty()
  requiresCustomerAddress: boolean;

  @ApiProperty()
  minimumOrderAmount: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  static fromDomain(serviceType: ServiceType): ServiceTypeResponseDto {
    const dto = new ServiceTypeResponseDto();
    dto.id = serviceType.id;
    dto.restaurantId = serviceType.restaurantId;
    dto.code = serviceType.code;
    dto.name = serviceType.name;
    dto.fulfillmentMode = serviceType.fulfillmentMode;
    dto.requiresTable = serviceType.requiresTable;
    dto.requiresCustomerAddress = serviceType.requiresCustomerAddress;
    dto.minimumOrderAmount = serviceType.minimumOrderAmount;
    dto.deliveryFee = serviceType.deliveryFee;
    dto.sortOrder = serviceType.sortOrder;
    dto.isActive = serviceType.isActive;
    return dto;
  }
}
