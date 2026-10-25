import { ApiProperty } from '@nestjs/swagger';
import { RestaurantFloor } from '../../../../domain/entities/restaurant-floor.entity.js';

export class RestaurantFloorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ example: 'Primer piso' })
  name: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(floor: RestaurantFloor): RestaurantFloorResponseDto {
    const dto = new RestaurantFloorResponseDto();
    dto.id = floor.id;
    dto.restaurantId = floor.restaurantId;
    dto.name = floor.name;
    dto.sortOrder = floor.sortOrder;
    dto.isActive = floor.isActive;
    dto.createdAt = floor.createdAt;
    dto.updatedAt = floor.updatedAt;
    return dto;
  }
}
