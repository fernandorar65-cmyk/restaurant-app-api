import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProductCategoryDto } from './create-product-category.dto.js';

export class UpdateProductCategoryDto extends PartialType(
  OmitType(CreateProductCategoryDto, ['restaurantId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
