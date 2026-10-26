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
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { ExpenseCategoriesService } from '../../../application/expense-categories/expense-categories.service.js';
import {
  CreateExpenseCategoryDto,
  ExpenseCategoryResponseDto,
  UpdateExpenseCategoryDto,
} from '../dto/finance.dto.js';

@ApiTags('finance/expense-categories')
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly categoriesService: ExpenseCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría de gasto' })
  @ApiCreatedResponse({ type: ExpenseCategoryResponseDto })
  async create(
    @Body() dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return ExpenseCategoryResponseDto.fromDomain(
      await this.categoriesService.create(dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías de gasto' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiPaginatedResponse(ExpenseCategoryResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<PageResponse<ExpenseCategoryResponseDto>> {
    const categories = await this.categoriesService.findPage({ organizationId }, page);
    return toPageResponse(categories, (category) =>
      ExpenseCategoryResponseDto.fromDomain(category),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría de gasto' })
  @ApiOkResponse({ type: ExpenseCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseCategoryResponseDto> {
    return ExpenseCategoryResponseDto.fromDomain(
      await this.categoriesService.findOne(id),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría de gasto' })
  @ApiOkResponse({ type: ExpenseCategoryResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return ExpenseCategoryResponseDto.fromDomain(
      await this.categoriesService.update(id, dto),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar una categoría de gasto (baja lógica)',
    description: 'No se borra: los gastos pasados siguen apuntando a ella',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.categoriesService.deactivate(id);
    return { id };
  }
}
