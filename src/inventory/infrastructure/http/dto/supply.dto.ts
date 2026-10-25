import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Supply } from '../../../domain/entities/supply.entity.js';

export class CreateSupplyDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ description: 'Categoría de inventario de la misma organización' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'LIM-01', description: 'Único dentro del restaurante' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Limón' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'kg' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  unitOfMeasure: string;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minimumQuantity?: number;
}

export class UpdateSupplyDto extends PartialType(
  OmitType(CreateSupplyDto, ['restaurantId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SupplyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ example: 'LIM-01' })
  code: string;

  @ApiProperty({ example: 'Limón' })
  name: string;

  @ApiProperty({ example: 'kg' })
  unitOfMeasure: string;

  @ApiProperty()
  minimumQuantity: number;

  @ApiProperty({ description: 'Solo cambia mediante movimientos' })
  currentQuantity: number;

  @ApiProperty()
  averageUnitCost: number;

  @ApiProperty()
  isBelowMinimum: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(supply: Supply): SupplyResponseDto {
    const dto = new SupplyResponseDto();
    dto.id = supply.id;
    dto.restaurantId = supply.restaurantId;
    dto.categoryId = supply.categoryId;
    dto.code = supply.code;
    dto.name = supply.name;
    dto.unitOfMeasure = supply.unitOfMeasure;
    dto.minimumQuantity = supply.minimumQuantity;
    dto.currentQuantity = supply.currentQuantity;
    dto.averageUnitCost = supply.averageUnitCost;
    dto.isBelowMinimum = supply.isBelowMinimum;
    dto.isActive = supply.isActive;
    dto.createdAt = supply.createdAt;
    dto.updatedAt = supply.updatedAt;
    return dto;
  }
}
