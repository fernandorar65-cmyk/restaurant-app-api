import { ApiProperty } from '@nestjs/swagger';
import type {
  ProductSalesRow,
  StageTime,
} from '../../../application/ports/finance-lookups.port.js';
import type {
  DailyFinancialsReport,
  RestaurantMetrics,
} from '../../../application/reports/financial-reports.service.js';
import type {
  DailyFinancials,
  PeriodTotals,
} from '../../../domain/services/financial-reports.js';
import { PaymentMethodTotalDto } from './finance.dto.js';

export class PeriodTotalsDto {
  @ApiProperty()
  openedAttentions: number;

  @ApiProperty()
  closedAttentions: number;

  @ApiProperty()
  cancelledAttentions: number;

  @ApiProperty()
  grossSales: number;

  @ApiProperty()
  refundedAmount: number;

  @ApiProperty({ description: 'Ventas brutas menos reembolsos' })
  netSales: number;

  @ApiProperty({ description: 'Gastos registrados (no anulados)' })
  expenseAmount: number;

  @ApiProperty({
    description:
      'Ventas netas menos gastos (sin costo de insumos ni de personal)',
  })
  profit: number;

  @ApiProperty({ description: 'Ventas netas / atenciones cerradas' })
  averageTicket: number;

  @ApiProperty({ type: [PaymentMethodTotalDto] })
  byMethod: PaymentMethodTotalDto[];

  static from(totals: PeriodTotals): PeriodTotalsDto {
    return Object.assign(new PeriodTotalsDto(), totals);
  }
}

export class DailyFinancialsDto extends PeriodTotalsDto {
  @ApiProperty({ example: '2026-10-25' })
  businessDate: string;

  static fromDay(day: DailyFinancials): DailyFinancialsDto {
    return Object.assign(new DailyFinancialsDto(), day);
  }
}

export class DailyFinancialsReportDto {
  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ example: '2026-10-01' })
  from: string;

  @ApiProperty({ example: '2026-10-31' })
  to: string;

  @ApiProperty({
    type: [DailyFinancialsDto],
    description: 'Todos los días del periodo, con ceros si no hubo actividad',
  })
  days: DailyFinancialsDto[];

  @ApiProperty({ type: PeriodTotalsDto })
  totals: PeriodTotalsDto;

  static from(report: DailyFinancialsReport): DailyFinancialsReportDto {
    const dto = new DailyFinancialsReportDto();
    dto.restaurantId = report.restaurantId;
    dto.from = report.from;
    dto.to = report.to;
    dto.days = report.days.map((day) => DailyFinancialsDto.fromDay(day));
    dto.totals = PeriodTotalsDto.from(report.totals);
    return dto;
  }
}

export class ProductSalesDto {
  @ApiProperty()
  productId: string;

  @ApiProperty({ example: 'Lomo saltado' })
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  revenue: number;

  static from(row: ProductSalesRow): ProductSalesDto {
    return Object.assign(new ProductSalesDto(), row);
  }
}

export class StageTimeDto {
  @ApiProperty({ example: 'IN_PREPARATION' })
  from: string;

  @ApiProperty({ example: 'READY' })
  to: string;

  @ApiProperty({ example: 12.5 })
  averageMinutes: number;

  @ApiProperty({ description: 'Platos que pasaron por ambos estados' })
  items: number;

  static from(stage: StageTime): StageTimeDto {
    return Object.assign(new StageTimeDto(), stage);
  }
}

export class RestaurantMetricsDto {
  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  from: string;

  @ApiProperty()
  to: string;

  @ApiProperty({ type: PeriodTotalsDto })
  totals: PeriodTotalsDto;

  @ApiProperty({
    type: [ProductSalesDto],
    description: 'Más vendidos por cantidad',
  })
  topProducts: ProductSalesDto[];

  @ApiProperty({
    type: [StageTimeDto],
    description:
      'Espera (SUBMITTED→IN_PREPARATION), preparación (→READY), entrega (→SERVED) y total (SUBMITTED→SERVED)',
  })
  stageTimes: StageTimeDto[];

  static from(metrics: RestaurantMetrics): RestaurantMetricsDto {
    const dto = new RestaurantMetricsDto();
    dto.restaurantId = metrics.restaurantId;
    dto.from = metrics.from;
    dto.to = metrics.to;
    dto.totals = PeriodTotalsDto.from(metrics.totals);
    dto.topProducts = metrics.topProducts.map((row) =>
      ProductSalesDto.from(row),
    );
    dto.stageTimes = metrics.stageTimes.map((stage) =>
      StageTimeDto.from(stage),
    );
    return dto;
  }
}
