import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
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
import { DailyClosuresService } from '../../../application/daily-closures/daily-closures.service.js';
import {
  CloseDayDto,
  ClosurePreviewResponseDto,
  DailyClosureResponseDto,
} from '../dto/finance.dto.js';

@ApiTags('finance/daily-closures')
@Controller('daily-closures')
export class DailyClosuresController {
  constructor(private readonly closuresService: DailyClosuresService) {}

  @Get('preview')
  @ApiOperation({
    summary: 'Cifras que tendría el cierre del día, sin guardarlo',
    description: 'Calculadas para la fecha comercial en la zona horaria de la sede',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiQuery({ name: 'businessDate', required: true, example: '2026-10-25' })
  @ApiOkResponse({ type: ClosurePreviewResponseDto })
  async preview(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('businessDate', new ParseBusinessDatePipe()) businessDate: string,
  ): Promise<ClosurePreviewResponseDto> {
    return ClosurePreviewResponseDto.fromPreview(
      await this.closuresService.preview(restaurantId, businessDate),
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Cerrar el día de una sede',
    description:
      'Guarda una foto inmutable de las cifras. Solo un cierre por sede y fecha; no se permiten fechas futuras',
  })
  @ApiCreatedResponse({ type: DailyClosureResponseDto })
  async close(
    @Body() dto: CloseDayDto,
    @CurrentUser() user: RequestUser,
  ): Promise<DailyClosureResponseDto> {
    return DailyClosureResponseDto.fromDomain(
      await this.closuresService.close(dto, user.id),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar cierres diarios' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-31' })
  @ApiPaginatedResponse(DailyClosureResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true })) restaurantId?: string,
    @Query('from', new ParseBusinessDatePipe({ optional: true })) from?: string,
    @Query('to', new ParseBusinessDatePipe({ optional: true })) to?: string,
  ): Promise<PageResponse<DailyClosureResponseDto>> {
    const closures = await this.closuresService.findPage({ restaurantId, from, to }, page);
    return toPageResponse(closures, (closure) =>
      DailyClosureResponseDto.fromDomain(closure),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cierre con su desglose por método de pago' })
  @ApiOkResponse({ type: DailyClosureResponseDto })
  @ApiNotFoundResponse({ description: 'Cierre no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DailyClosureResponseDto> {
    return DailyClosureResponseDto.fromDomain(await this.closuresService.findOne(id));
  }
}
