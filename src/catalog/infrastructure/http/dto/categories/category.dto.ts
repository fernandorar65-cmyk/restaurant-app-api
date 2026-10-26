import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Category } from '../../../../domain/entities/category.entity.js';
import { MenuSection } from '../../../../domain/entities/menu-section.entity.js';

export class CreateCategoryDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'Categoría padre de la misma organización (vacío = categoría raíz)',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string | null;

  @ApiProperty({
    example: 'Bebidas',
    description: 'Único dentro del mismo padre (sin distinguir mayúsculas)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['organizationId'] as const),
) {
  @ApiPropertyOptional({ description: 'false = desactivar, true = reactivar' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional({ nullable: true })
  parentCategoryId: string | null;

  @ApiProperty({ example: 'Bebidas' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.organizationId = category.organizationId;
    dto.parentCategoryId = category.parentCategoryId;
    dto.name = category.name;
    dto.description = category.description;
    dto.isActive = category.isActive;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}

export class AddProductCategoryDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;
}

export class CreateMenuSectionDto {
  @ApiProperty({ example: 'Entradas', description: 'Único dentro del menú (sin distinguir mayúsculas)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Categoría que reutiliza la sección (opcional)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateMenuSectionDto extends PartialType(CreateMenuSectionDto) {
  @ApiPropertyOptional({ description: 'false = ocultar la sección, true = mostrarla' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MenuSectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  menuId: string;

  @ApiPropertyOptional({ nullable: true })
  categoryId: string | null;

  @ApiProperty({ example: 'Entradas' })
  name: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(section: MenuSection): MenuSectionResponseDto {
    const dto = new MenuSectionResponseDto();
    dto.id = section.id;
    dto.menuId = section.menuId;
    dto.categoryId = section.categoryId;
    dto.name = section.name;
    dto.sortOrder = section.sortOrder;
    dto.isActive = section.isActive;
    dto.createdAt = section.createdAt;
    dto.updatedAt = section.updatedAt;
    return dto;
  }
}
