import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRestaurantFloorDto } from './create-restaurant-floor.dto.js';

export class UpdateRestaurantFloorDto extends PartialType(
  OmitType(CreateRestaurantFloorDto, ['restaurantId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
