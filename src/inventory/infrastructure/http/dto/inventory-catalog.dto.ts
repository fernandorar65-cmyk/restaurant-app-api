import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MovementEffect } from '../../../domain/enums/movement-effect.enum.js';
import { UnitDimension } from '../../../domain/enums/unit-dimension.enum.js';
import type {
  MovementType,
  UnitOfMeasure,
} from '../../../domain/repositories/inventory-catalog.repository.js';

export class UnitOfMeasureResponseDto {
  @ApiProperty({ example: 'KG' })
  code: string;

  @ApiProperty({ example: 'Kilogramo' })
  name: string;

  @ApiProperty({ enum: UnitDimension })
  dimension: UnitDimension;

  @ApiProperty({ example: 1, description: 'Factor a la unidad base de su dimensión (KG, L, UNIT)' })
  conversionFactorToBase: number;

  @ApiProperty()
  isActive: boolean;

  static from(unit: UnitOfMeasure): UnitOfMeasureResponseDto {
    return Object.assign(new UnitOfMeasureResponseDto(), unit);
  }
}

export class MovementTypeResponseDto {
  @ApiProperty({ example: 'PURCHASE' })
  code: string;

  @ApiProperty({ example: 'Compra' })
  name: string;

  @ApiProperty({ enum: MovementEffect })
  effect: MovementEffect;

  @ApiProperty()
  isActive: boolean;

  static from(type: MovementType): MovementTypeResponseDto {
    return Object.assign(new MovementTypeResponseDto(), type);
  }
}

export class UpdateUnitOfMeasureDto {
  @ApiPropertyOptional({ example: 'Kilogramo' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: 'false = no se puede usar en insumos nuevos' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RenameMovementTypeDto {
  @ApiProperty({ example: 'Compra a proveedor' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
