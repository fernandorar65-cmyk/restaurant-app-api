import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ServiceMode } from '../../../../domain/service-mode.js';

const SERVICE_MODES: ServiceMode[] = ['DINE_IN', 'PICKUP', 'DELIVERY'];

export class CartValidateItemDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 28.0,
    description: 'Precio que vio el cliente; solo sirve para avisar si cambió',
  })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CartValidateDto {
  @ApiProperty({ enum: SERVICE_MODES, example: 'DINE_IN' })
  @IsIn(SERVICE_MODES)
  serviceType: ServiceMode;

  @ApiProperty({ type: [CartValidateItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartValidateItemDto)
  items: CartValidateItemDto[];
}
