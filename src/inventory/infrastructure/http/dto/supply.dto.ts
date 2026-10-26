import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Supply } from '../../../domain/entities/supply.entity.js';

export class CreateSupplyDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'Categoría de inventario de la misma organización' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'ARROZ', description: 'Único por organización (se guarda en mayúsculas)' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Arroz' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'KG', description: 'Unidad base del catálogo (GET /units-of-measure)' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  unitCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdateSupplyDto extends PartialType(
  OmitType(CreateSupplyDto, ['organizationId'] as const),
) {
  @ApiPropertyOptional({ description: 'false = desactivar, true = reactivar' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SupplyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ example: 'ARROZ' })
  code: string;

  @ApiProperty({ example: 'Arroz' })
  name: string;

  @ApiProperty({ example: 'KG' })
  unitCode: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(supply: Supply): SupplyResponseDto {
    const dto = new SupplyResponseDto();
    dto.id = supply.id;
    dto.organizationId = supply.organizationId;
    dto.categoryId = supply.categoryId;
    dto.code = supply.code;
    dto.name = supply.name;
    dto.unitCode = supply.unitCode;
    dto.description = supply.description;
    dto.isActive = supply.isActive;
    dto.createdAt = supply.createdAt;
    dto.updatedAt = supply.updatedAt;
    return dto;
  }
}
