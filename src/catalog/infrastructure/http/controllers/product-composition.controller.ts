import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductCompositionService } from '../../../application/product-composition/product-composition.service.js';
import {
  AddProductAllergenDto,
  AllergenResponseDto,
  CreateIngredientDto,
  IngredientResponseDto,
  UpdateIngredientDto,
} from '../dto/composition/composition.dto.js';

/** Allergens and visible ingredients of a product. */
@ApiTags('catalog/products')
@Controller('products/:productId')
export class ProductCompositionController {
  constructor(private readonly compositionService: ProductCompositionService) {}

  @Get('allergens')
  @ApiOperation({ summary: 'Alérgenos del producto' })
  @ApiOkResponse({ type: [AllergenResponseDto] })
  async listAllergens(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<AllergenResponseDto[]> {
    const allergens = await this.compositionService.listAllergens(productId);
    return allergens.map((allergen) => AllergenResponseDto.fromDomain(allergen));
  }

  @Post('allergens')
  @ApiOperation({ summary: 'Marcar que el producto contiene un alérgeno' })
  @ApiCreatedResponse({ type: AllergenResponseDto })
  async addAllergen(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: AddProductAllergenDto,
  ): Promise<AllergenResponseDto> {
    return AllergenResponseDto.fromDomain(
      await this.compositionService.addAllergen(productId, dto.allergenId),
    );
  }

  @Delete('allergens/:allergenId')
  @ApiOperation({ summary: 'Quitar un alérgeno del producto' })
  @ApiOkResponse({ description: 'Alérgeno quitado' })
  async removeAllergen(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('allergenId', ParseUUIDPipe) allergenId: string,
  ): Promise<{ productId: string; allergenId: string }> {
    await this.compositionService.removeAllergen(productId, allergenId);
    return { productId, allergenId };
  }

  @Get('ingredients')
  @ApiOperation({ summary: 'Ingredientes del producto' })
  @ApiOkResponse({ type: [IngredientResponseDto] })
  async listIngredients(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<IngredientResponseDto[]> {
    const ingredients = await this.compositionService.listIngredients(productId);
    return ingredients.map((ingredient) => IngredientResponseDto.fromDomain(ingredient));
  }

  @Post('ingredients')
  @ApiOperation({ summary: 'Agregar un ingrediente' })
  @ApiCreatedResponse({ type: IngredientResponseDto })
  async addIngredient(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateIngredientDto,
  ): Promise<IngredientResponseDto> {
    return IngredientResponseDto.fromDomain(
      await this.compositionService.addIngredient(productId, dto),
    );
  }

  @Patch('ingredients/:ingredientId')
  @ApiOperation({ summary: 'Editar un ingrediente' })
  @ApiOkResponse({ type: IngredientResponseDto })
  async updateIngredient(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('ingredientId', ParseUUIDPipe) ingredientId: string,
    @Body() dto: UpdateIngredientDto,
  ): Promise<IngredientResponseDto> {
    return IngredientResponseDto.fromDomain(
      await this.compositionService.updateIngredient(productId, ingredientId, dto),
    );
  }

  @Delete('ingredients/:ingredientId')
  @ApiOperation({ summary: 'Eliminar un ingrediente' })
  @ApiOkResponse({ description: 'Ingrediente eliminado' })
  async removeIngredient(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('ingredientId', ParseUUIDPipe) ingredientId: string,
  ): Promise<{ id: string }> {
    await this.compositionService.removeIngredient(productId, ingredientId);
    return { id: ingredientId };
  }
}
