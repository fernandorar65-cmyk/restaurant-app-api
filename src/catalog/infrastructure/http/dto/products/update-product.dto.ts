import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ProductStatus } from '../../../../domain/enums/product-status.enum.js';
import { CreateProductDto } from './create-product.dto.js';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
