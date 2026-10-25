import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from '../../../application/categories/categories.service.js';
import { CategoryResponseDto } from '../dto/categories/category-response.dto.js';
import { CreateCategoryDto } from '../dto/categories/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/categories/update-category.dto.js';

@ApiTags('organizations/categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(dto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll();
    return categories.map(CategoryResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findOne(id);
    return CategoryResponseDto.fromDomain(category);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.update(id, dto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id de la categoría eliminada' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.categoriesService.remove(id);
    return { id };
  }
}
