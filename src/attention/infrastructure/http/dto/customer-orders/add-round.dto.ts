import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateCustomerOrderItemDto } from './create-customer-order-item.dto.js';

export class AddRoundDto {
  @ApiProperty({ type: [CreateCustomerOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerOrderItemDto)
  items: CreateCustomerOrderItemDto[];
}
