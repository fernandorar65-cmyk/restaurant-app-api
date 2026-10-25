import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../../../domain/entities/category.entity.js';

export class CategoryResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Entradas' })
  name: string;

  @ApiPropertyOptional({ example: 'Platillos para abrir el apetito' })
  description: string | null;

  @ApiProperty()
  menuId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.description = category.description;
    dto.menuId = category.menuId;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}
