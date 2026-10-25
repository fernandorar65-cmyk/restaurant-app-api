import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Menu } from '../../../../domain/entities/menu.entity.js';
import { MenuStatus } from '../../../../domain/enums/menu-status.enum.js';

export class MenuResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ example: 'Carta principal' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: MenuStatus })
  status: MenuStatus;

  @ApiPropertyOptional({ nullable: true })
  validFrom: Date | null;

  @ApiPropertyOptional({ nullable: true })
  validUntil: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(menu: Menu): MenuResponseDto {
    const dto = new MenuResponseDto();
    dto.id = menu.id;
    dto.restaurantId = menu.restaurantId;
    dto.name = menu.name;
    dto.description = menu.description;
    dto.status = menu.status;
    dto.validFrom = menu.validFrom;
    dto.validUntil = menu.validUntil;
    dto.createdAt = menu.createdAt;
    dto.updatedAt = menu.updatedAt;
    return dto;
  }
}
