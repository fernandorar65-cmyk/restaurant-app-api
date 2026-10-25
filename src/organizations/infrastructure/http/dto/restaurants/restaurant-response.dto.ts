import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';

export class RestaurantResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Restaurante Centro' })
  name: string;

  @ApiProperty({ example: 'restaurante-centro' })
  slug: string;

  @ApiPropertyOptional({ example: 'Av. Reforma 123, CDMX' })
  address: string | null;

  @ApiPropertyOptional({ example: '+52 55 8765 4321' })
  phone: string | null;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(restaurant: Restaurant): RestaurantResponseDto {
    const dto = new RestaurantResponseDto();
    dto.id = restaurant.id;
    dto.name = restaurant.name;
    dto.slug = restaurant.slug;
    dto.address = restaurant.address;
    dto.phone = restaurant.phone;
    dto.organizationId = restaurant.organizationId;
    dto.createdAt = restaurant.createdAt;
    dto.updatedAt = restaurant.updatedAt;
    return dto;
  }
}
