import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductRecipesService } from '../../../application/product-recipes/product-recipes.service.js';
import {
  RecipeLineResponseDto,
  SetRecipeLineDto,
} from '../dto/product-recipe.dto.js';

@ApiTags('inventory/recipes')
@Controller('product-recipes/:productId')
export class ProductRecipesController {
  constructor(private readonly recipesService: ProductRecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Receta del producto: insumos que consume por unidad' })
  @ApiOkResponse({ type: [RecipeLineResponseDto] })
  async list(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<RecipeLineResponseDto[]> {
    const lines = await this.recipesService.list(productId);
    return lines.map((line) => RecipeLineResponseDto.fromDomain(line));
  }

  @Put('supplies/:supplyId')
  @ApiOperation({
    summary: 'Agregar o actualizar un insumo de la receta',
    description: 'El insumo debe ser de la misma sede que el producto',
  })
  @ApiOkResponse({ type: RecipeLineResponseDto })
  async setLine(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('supplyId', ParseUUIDPipe) supplyId: string,
    @Body() dto: SetRecipeLineDto,
  ): Promise<RecipeLineResponseDto> {
    return RecipeLineResponseDto.fromDomain(
      await this.recipesService.setLine(productId, supplyId, dto),
    );
  }

  @Delete('supplies/:supplyId')
  @ApiOperation({ summary: 'Quitar un insumo de la receta' })
  @ApiOkResponse({ description: 'Insumo quitado de la receta' })
  async removeLine(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('supplyId', ParseUUIDPipe) supplyId: string,
  ): Promise<{ productId: string; supplyId: string }> {
    await this.recipesService.removeLine(productId, supplyId);
    return { productId, supplyId };
  }
}
