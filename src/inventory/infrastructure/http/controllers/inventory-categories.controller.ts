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
import { InventoryCategoriesService } from '../../../application/inventory-categories/inventory-categories.service.js';
import {
  CreateInventoryCategoryDto,
  InventoryCategoryResponseDto,
  UpdateInventoryCategoryDto,
} from '../dto/inventory-category.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('inventory/categories')
@Controller('inventory-categories')
export class InventoryCategoriesController {
  constructor(private readonly categoriesService: InventoryCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría de inventario' })
  @ApiCreatedResponse({ type: InventoryCategoryResponseDto })
  async create(
    @Body() dto: CreateInventoryCategoryDto,
  ): Promise<InventoryCategoryResponseDto> {
    const category = await this.categoriesService.create(dto);
    return InventoryCategoryResponseDto.fromDomain(category);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías de inventario' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiPaginatedResponse(InventoryCategoryResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<PageResponse<InventoryCategoryResponseDto>> {
    const categories = await this.categoriesService.findPage({ organizationId }, page);
    return toPageResponse(categories, (category) =>
      InventoryCategoryResponseDto.fromDomain(category),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría de inventario' })
  @ApiOkResponse({ type: InventoryCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryCategoryResponseDto> {
    const category = await this.categoriesService.findOne(id);
    return InventoryCategoryResponseDto.fromDomain(category);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría de inventario' })
  @ApiOkResponse({ type: InventoryCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCategoryDto,
  ): Promise<InventoryCategoryResponseDto> {
    const category = await this.categoriesService.update(id, dto);
    return InventoryCategoryResponseDto.fromDomain(category);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría de inventario' })
  @ApiOkResponse({ description: 'Id de la categoría eliminada' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.categoriesService.remove(id);
    return { id };
  }
}
