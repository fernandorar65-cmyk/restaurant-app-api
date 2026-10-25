import { ApiProperty } from '@nestjs/swagger';
import { KitchenSupply } from '../../../../domain/entities/kitchen-supply.entity.js';

export class KitchenSupplyResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Aceite de oliva' })
  name: string;

  @ApiProperty({ example: 'litro' })
  unit: string;

  @ApiProperty({ example: 10.5 })
  quantity: number;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(kitchenSupply: KitchenSupply): KitchenSupplyResponseDto {
    const dto = new KitchenSupplyResponseDto();
    dto.id = kitchenSupply.id;
    dto.name = kitchenSupply.name;
    dto.unit = kitchenSupply.unit;
    dto.quantity = kitchenSupply.quantity;
    dto.restaurantId = kitchenSupply.restaurantId;
    dto.createdAt = kitchenSupply.createdAt;
    dto.updatedAt = kitchenSupply.updatedAt;
    return dto;
  }
}
