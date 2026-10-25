import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Menu } from '../../../../domain/entities/menu.entity.js';

export class MenuResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Menú de temporada' })
  name: string;

  @ApiPropertyOptional({ example: 'Disponible de marzo a mayo' })
  description: string | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(menu: Menu): MenuResponseDto {
    const dto = new MenuResponseDto();
    dto.id = menu.id;
    dto.name = menu.name;
    dto.description = menu.description;
    dto.active = menu.active;
    dto.restaurantId = menu.restaurantId;
    dto.createdAt = menu.createdAt;
    dto.updatedAt = menu.updatedAt;
    return dto;
  }
}
