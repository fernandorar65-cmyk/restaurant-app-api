import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../../../domain/entities/product.entity.js';

export class ProductResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Ceviche' })
  name: string;

  @ApiPropertyOptional({ example: 'Pescado fresco marinado en limón' })
  description: string | null;

  @ApiProperty({ example: 12.5 })
  price: number;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = product.price;
    dto.available = product.available;
    dto.categoryId = product.categoryId;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}
