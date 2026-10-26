import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { InventoryCategory } from '../../../domain/entities/inventory-category.entity.js';

export class CreateInventoryCategoryDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Verduras' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdateInventoryCategoryDto extends PartialType(
  PickType(CreateInventoryCategoryDto, ['name', 'description'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class InventoryCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ example: 'Verduras' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(category: InventoryCategory): InventoryCategoryResponseDto {
    const dto = new InventoryCategoryResponseDto();
    dto.id = category.id;
    dto.organizationId = category.organizationId;
    dto.name = category.name;
    dto.description = category.description;
    dto.isActive = category.isActive;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}
