import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';
import { CreateRestaurantDto } from './create-restaurant.dto.js';

export class UpdateRestaurantDto extends PartialType(
  OmitType(CreateRestaurantDto, ['organizationId', 'code', 'slug'] as const),
) {
  @ApiPropertyOptional({ enum: RestaurantStatus })
  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;
}
