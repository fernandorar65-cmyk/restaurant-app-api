import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType } from '../../../../domain/entities/fulfillment-type.enum.js';
import { CreateCustomerOrderItemDto } from './create-customer-order-item.dto.js';

export class CreateCustomerOrderDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ enum: FulfillmentType, example: FulfillmentType.DINE_IN })
  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @ApiPropertyOptional({
    description: 'Token del QR de la mesa. Requerido para dine_in.',
  })
  @IsOptional()
  @IsString()
  tableToken?: string;

  @ApiPropertyOptional({
    description:
      'Dirección de entrega en texto libre. Requerido para delivery (el CRUD de direcciones guardadas queda para una fase futura).',
    example: 'Av. Reforma 123, CDMX',
  })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ type: [CreateCustomerOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerOrderItemDto)
  items: CreateCustomerOrderItemDto[];
}
