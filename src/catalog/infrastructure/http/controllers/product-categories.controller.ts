import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProductCategoriesService } from '../../../application/product-categories/product-categories.service.js';
import { CreateProductCategoryDto } from '../dto/product-categories/create-product-category.dto.js';
import { ProductCategoryResponseDto } from '../dto/product-categories/product-category-response.dto.js';
import { UpdateProductCategoryDto } from '../dto/product-categories/update-product-category.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('catalog/product-categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría de productos' })
  @ApiCreatedResponse({ type: ProductCategoryResponseDto })
  async create(
    @Body() dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.categoriesService.create(dto);
    return ProductCategoryResponseDto.fromDomain(category);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías de productos' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiPaginatedResponse(ProductCategoryResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
  ): Promise<PageResponse<ProductCategoryResponseDto>> {
    const categories = await this.categoriesService.findPage({ restaurantId }, page);
    return toPageResponse(categories, (category) =>
      ProductCategoryResponseDto.fromDomain(category),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por id' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.categoriesService.findOne(id);
    return ProductCategoryResponseDto.fromDomain(category);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.categoriesService.update(id, dto);
    return ProductCategoryResponseDto.fromDomain(category);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar una categoría (si no tiene productos) (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.categoriesService.deactivate(id);
    return { id };
  }
}
