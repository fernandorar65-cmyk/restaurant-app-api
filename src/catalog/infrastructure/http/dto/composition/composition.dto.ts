import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Allergen } from '../../../../domain/entities/allergen.entity.js';
import { ProductIngredient } from '../../../../domain/entities/product-ingredient.entity.js';

export class CreateAllergenDto {
  @ApiProperty({ example: 'GLUTEN' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Gluten' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

export class RenameAllergenDto {
  @ApiProperty({ example: 'Gluten (trigo, cebada, centeno)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

export class AllergenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'GLUTEN' })
  code: string;

  @ApiProperty({ example: 'Gluten' })
  name: string;

  static fromDomain(allergen: Allergen): AllergenResponseDto {
    const dto = new AllergenResponseDto();
    dto.id = allergen.id;
    dto.code = allergen.code;
    dto.name = allergen.name;
    return dto;
  }
}

export class AddProductAllergenDto {
  @ApiProperty()
  @IsUUID()
  allergenId: string;
}

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
