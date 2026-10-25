import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';

export class RestaurantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ example: 'MIRAFLORES' })
  code: string;

  @ApiProperty({ example: 'sabores-miraflores' })
  slug: string;

  @ApiProperty({ example: 'Sabores Miraflores' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  address: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude: number | null;

  @ApiProperty({ example: 'PEN' })
  currencyCode: string;

  @ApiProperty({ example: 'America/Lima' })
  timezone: string;

  @ApiProperty({ enum: RestaurantStatus })
  status: RestaurantStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(restaurant: Restaurant): RestaurantResponseDto {
    const dto = new RestaurantResponseDto();
    dto.id = restaurant.id;
    dto.organizationId = restaurant.organizationId;
    dto.code = restaurant.code;
    dto.slug = restaurant.slug;
    dto.name = restaurant.name;
    dto.description = restaurant.description;
    dto.address = restaurant.address;
    dto.phone = restaurant.phone;
    dto.email = restaurant.email;
    dto.latitude = restaurant.latitude;
    dto.longitude = restaurant.longitude;
    dto.currencyCode = restaurant.currencyCode;
    dto.timezone = restaurant.timezone;
    dto.status = restaurant.status;
    dto.createdAt = restaurant.createdAt;
    dto.updatedAt = restaurant.updatedAt;
    return dto;
  }
}
