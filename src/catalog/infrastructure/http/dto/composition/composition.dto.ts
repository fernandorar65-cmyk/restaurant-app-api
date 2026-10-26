import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProductIngredient } from '../../../../domain/entities/product-ingredient.entity.js';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Cebolla morada' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true, description: 'Mostrarlo en la carta' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}

export class IngredientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ example: 'Cebolla morada' })
  name: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isVisible: boolean;

  static fromDomain(ingredient: ProductIngredient): IngredientResponseDto {
    const dto = new IngredientResponseDto();
    dto.id = ingredient.id;
    dto.productId = ingredient.productId;
    dto.name = ingredient.name;
    dto.sortOrder = ingredient.sortOrder;
    dto.isVisible = ingredient.isVisible;
    return dto;
  }
}
