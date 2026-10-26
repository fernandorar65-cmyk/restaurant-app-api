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
import { ProductsService } from '../../../application/products/products.service.js';
import {
  AddProductCategoryDto,
  CategoryResponseDto,
} from '../dto/categories/category.dto.js';
import { CreateProductDto } from '../dto/products/create-product.dto.js';
import { ProductResponseDto } from '../dto/products/product-response.dto.js';
import { UpdateProductDto } from '../dto/products/update-product.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('catalog/products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un producto' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsService.create(dto);
    return ProductResponseDto.fromDomain(product);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Productos de esa categoría' })
  @ApiPaginatedResponse(ProductResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
    @Query('categoryId', new ParseUUIDPipe({ optional: true }))
    categoryId?: string,
  ): Promise<PageResponse<ProductResponseDto>> {
    const products = await this.productsService.findPage({
      restaurantId,
      categoryId,
    }, page);
    return toPageResponse(products, (product) =>
      ProductResponseDto.fromDomain(product),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return ProductResponseDto.fromDomain(product);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto (precio, disponibilidad, estado...)' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, dto);
    return ProductResponseDto.fromDomain(product);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un producto (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.productsService.deactivate(id);
    return { id };
  }

  @Get(':id/categories')
  @ApiOperation({ summary: 'Categorías del producto' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  async listCategories(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.productsService.listCategories(id);
    return categories.map((category) => CategoryResponseDto.fromDomain(category));
  }

  @Post(':id/categories')
  @ApiOperation({ summary: 'Agregar el producto a una categoría de su organización' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async addCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProductCategoryDto,
  ): Promise<CategoryResponseDto> {
    return CategoryResponseDto.fromDomain(
      await this.productsService.addCategory(id, dto.categoryId),
    );
  }

  @Delete(':id/categories/:categoryId')
  @ApiOperation({ summary: 'Quitar el producto de una categoría' })
  @ApiOkResponse({ description: 'Producto quitado de la categoría' })
  async removeCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<{ productId: string; categoryId: string }> {
    await this.productsService.removeCategory(id, categoryId);
    return { productId: id, categoryId };
  }
}
