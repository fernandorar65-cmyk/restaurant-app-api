import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, ValidateNested } from 'class-validator';
import { CartValidateItemDto } from './cart-validate-item.dto.js';

export class CartValidateDto {
  @ApiProperty({ enum: ['dine_in', 'pickup', 'delivery'], example: 'dine_in' })
  @IsIn(['dine_in', 'pickup', 'delivery'])
  fulfillmentType: string;

  @ApiProperty({ type: [CartValidateItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartValidateItemDto)
  items: CartValidateItemDto[];
}
