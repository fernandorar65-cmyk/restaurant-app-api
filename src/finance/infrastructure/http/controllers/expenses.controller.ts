import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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
  CurrentUser,
  type RequestUser,
} from '../../../../common/infrastructure/http/current-user.decorator.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { ParseBusinessDatePipe } from '../../../../common/infrastructure/http/parse-business-date.pipe.js';
import { ExpensesService } from '../../../application/expenses/expenses.service.js';
import { ExpenseStatus } from '../../../domain/enums/expense-status.enum.js';
import {
  ExpenseResponseDto,
  RegisterExpenseDto,
  UpdateExpenseDto,
} from '../dto/finance.dto.js';

/** Expenses are never deleted: a mistaken one is voided. */
@ApiTags('finance/expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un gasto (queda a nombre del usuario de la sesión)' })
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  async register(
    @Body() dto: RegisterExpenseDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ExpenseResponseDto> {
    return ExpenseResponseDto.fromDomain(
      await this.expensesService.register(dto, user.id),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar gastos' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ExpenseStatus })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-31' })
  @ApiPaginatedResponse(ExpenseResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true })) restaurantId?: string,
    @Query('categoryId', new ParseUUIDPipe({ optional: true })) categoryId?: string,
    @Query('status', new ParseEnumPipe(ExpenseStatus, { optional: true }))
    status?: ExpenseStatus,
    @Query('from', new ParseBusinessDatePipe({ optional: true })) from?: string,
    @Query('to', new ParseBusinessDatePipe({ optional: true })) to?: string,
  ): Promise<PageResponse<ExpenseResponseDto>> {
    const expenses = await this.expensesService.findPage(
      { restaurantId, categoryId, status, from, to },
      page,
    );
    return toPageResponse(expenses, (expense) => ExpenseResponseDto.fromDomain(expense));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un gasto' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiNotFoundResponse({ description: 'Gasto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ExpenseResponseDto> {
    return ExpenseResponseDto.fromDomain(await this.expensesService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Corregir un gasto (solo si no está anulado)' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return ExpenseResponseDto.fromDomain(await this.expensesService.update(id, dto));
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular un gasto (queda registrado pero no suma)' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  async void(@Param('id', ParseUUIDPipe) id: string): Promise<ExpenseResponseDto> {
    return ExpenseResponseDto.fromDomain(await this.expensesService.void(id));
  }
}
