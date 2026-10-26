import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ProductRecipe } from '../../../domain/entities/product-recipe.entity.js';

export class SetRecipeLineDto {
  @ApiProperty({ example: 0.15, description: 'Cantidad del insumo por unidad del producto' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantityRequired: number;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Merma esperada en %' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  wastePercentage?: number;
}

export class RecipeLineResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  supplyId: string;

  @ApiProperty()
  quantityRequired: number;

  @ApiProperty()
  wastePercentage: number;

  @ApiProperty({ description: 'quantityRequired incluyendo la merma' })
  effectiveQuantity: number;

  static fromDomain(recipe: ProductRecipe): RecipeLineResponseDto {
    const dto = new RecipeLineResponseDto();
    dto.productId = recipe.productId;
    dto.supplyId = recipe.supplyId;
    dto.quantityRequired = recipe.quantityRequired;
    dto.wastePercentage = recipe.wastePercentage;
    dto.effectiveQuantity = recipe.effectiveQuantity;
    return dto;
  }
}
