import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../../../domain/entities/product.entity.js';
import { ProductStatus } from '../../../../domain/enums/product-status.enum.js';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ example: 'CEV-01' })
  code: string;

  @ApiProperty({ example: 'Ceviche clásico' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 32.5 })
  price: number;

  @ApiPropertyOptional({ nullable: true })
  preparationMinutes: number | null;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  isTakeawayAllowed: boolean;

  @ApiProperty()
  isDeliveryAllowed: boolean;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.restaurantId = product.restaurantId;
    dto.code = product.code;
    dto.name = product.name;
    dto.description = product.description;
    dto.imageUrl = product.imageUrl;
    dto.price = product.price;
    dto.preparationMinutes = product.preparationMinutes;
    dto.isAvailable = product.isAvailable;
    dto.isTakeawayAllowed = product.isTakeawayAllowed;
    dto.isDeliveryAllowed = product.isDeliveryAllowed;
    dto.status = product.status;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}
