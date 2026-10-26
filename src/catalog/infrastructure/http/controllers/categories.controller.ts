import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
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
import { CategoriesService } from '../../../application/categories/categories.service.js';
import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/categories/category.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

/** Product categories of an organization, as a tree (Comidas > Carnes > Parrillas). */
@ApiTags('catalog/categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría de productos' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return CategoryResponseDto.fromDomain(await this.categoriesService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'parentCategoryId', required: false, description: 'Solo las hijas directas' })
  @ApiQuery({ name: 'rootOnly', required: false, type: Boolean, description: 'Solo las categorías raíz' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiPaginatedResponse(CategoryResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
    @Query('parentCategoryId', new ParseUUIDPipe({ optional: true }))
    parentCategoryId?: string,
    @Query('rootOnly', new ParseBoolPipe({ optional: true })) rootOnly?: boolean,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ): Promise<PageResponse<CategoryResponseDto>> {
    const categories = await this.categoriesService.findPage(
      {
        organizationId,
        parentCategoryId: rootOnly ? null : parentCategoryId,
        isActive,
      },
      page,
    );
    return toPageResponse(categories, (category) => CategoryResponseDto.fromDomain(category));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por id' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return CategoryResponseDto.fromDomain(await this.categoriesService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una categoría (nombre, padre, activar/desactivar)',
    description: '`parentCategoryId: null` la convierte en categoría raíz',
  })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return CategoryResponseDto.fromDomain(await this.categoriesService.update(id, dto));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar una categoría (baja lógica)',
    description: 'No se borra: los productos y secciones que la usan la conservan',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.categoriesService.deactivate(id);
    return { id };
  }
}
