import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../../../../domain/entities/product-category.entity.js';

export class ProductCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ example: 'Entradas' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(category: ProductCategory): ProductCategoryResponseDto {
    const dto = new ProductCategoryResponseDto();
    dto.id = category.id;
    dto.restaurantId = category.restaurantId;
    dto.name = category.name;
    dto.description = category.description;
    dto.sortOrder = category.sortOrder;
    dto.isActive = category.isActive;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}
