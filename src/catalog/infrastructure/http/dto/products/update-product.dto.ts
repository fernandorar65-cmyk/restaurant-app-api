import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ProductStatus } from '../../../../domain/enums/product-status.enum.js';
import { CreateProductDto } from './create-product.dto.js';

/** Categories are managed through /products/:id/categories. */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['restaurantId', 'categoryIds'] as const),
) {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
