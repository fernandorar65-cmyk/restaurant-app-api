import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  FinancialReportsService,
  MAX_REPORT_DAYS,
} from '../../../application/reports/financial-reports.service.js';
import {
  DailyFinancialsReportDto,
  RestaurantMetricsDto,
} from '../dto/reports.dto.js';
import { ParseBusinessDatePipe } from '../../../../common/infrastructure/http/parse-business-date.pipe.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

const MAX_TOP_PRODUCTS = 50;

@ApiTags('finance/reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: FinancialReportsService) {}

  @Authorize('finance.read', Scope.restaurant('query'))
  @Get('daily-financials')
  @ApiOperation({
    summary: 'Serie diaria de finanzas de una sede',
    description: `Por día: atenciones, ventas brutas y netas, reembolsos, gastos, utilidad (ventas netas - gastos), ticket promedio y neto por método de pago; más el total del periodo. Fechas comerciales en la zona horaria de la sede; máximo ${MAX_REPORT_DAYS} días. Cada día coincide con el preview del cierre de ese día`,
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiQuery({ name: 'from', required: true, example: '2026-10-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-10-31' })
  @ApiOkResponse({ type: DailyFinancialsReportDto })
  async dailyFinancials(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('from', new ParseBusinessDatePipe()) from: string,
    @Query('to', new ParseBusinessDatePipe()) to: string,
  ): Promise<DailyFinancialsReportDto> {
    return DailyFinancialsReportDto.from(
      await this.reports.dailyFinancials(restaurantId, from, to),
    );
  }

  @Authorize('finance.read', Scope.restaurant('query'))
  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas de una sede en un periodo',
    description:
      'Totales del periodo (ventas, atenciones, ticket promedio), productos más vendidos (ítems cobrables de atenciones no canceladas) y tiempos promedio por etapa de cocina',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiQuery({ name: 'from', required: true, example: '2026-10-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-10-31' })
  @ApiQuery({ name: 'top', required: false, example: 10 })
  @ApiOkResponse({ type: RestaurantMetricsDto })
  async metrics(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('from', new ParseBusinessDatePipe()) from: string,
    @Query('to', new ParseBusinessDatePipe()) to: string,
    @Query('top', new DefaultValuePipe(10), ParseIntPipe) top: number,
  ): Promise<RestaurantMetricsDto> {
    return RestaurantMetricsDto.from(
      await this.reports.metrics(
        restaurantId,
        from,
        to,
        Math.min(Math.max(top, 1), MAX_TOP_PRODUCTS),
      ),
    );
  }
}
