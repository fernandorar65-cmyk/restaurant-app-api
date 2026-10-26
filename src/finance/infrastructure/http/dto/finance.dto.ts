import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '../../../../common/domain/payment-method.enum.js';
import type { ClosurePreview } from '../../../application/daily-closures/daily-closures.service.js';
import { DailyClosure } from '../../../domain/entities/daily-closure.entity.js';
import { ExpenseCategory } from '../../../domain/entities/expense-category.entity.js';
import { Expense } from '../../../domain/entities/expense.entity.js';
import { ExpenseStatus } from '../../../domain/enums/expense-status.enum.js';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// ---------- expense categories ----------

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Servicios' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Luz, agua, internet' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdateExpenseCategoryDto extends PartialType(
  OmitType(CreateExpenseCategoryDto, ['organizationId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ExpenseCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ example: 'Servicios' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  static fromDomain(category: ExpenseCategory): ExpenseCategoryResponseDto {
    const dto = new ExpenseCategoryResponseDto();
    dto.id = category.id;
    dto.organizationId = category.organizationId;
    dto.name = category.name;
    dto.description = category.description;
    dto.isActive = category.isActive;
    return dto;
  }
}

// ---------- expenses ----------

export class RegisterExpenseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ description: 'Categoría de gasto de la misma organización' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Recibo de luz octubre' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 320.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-10-25', description: 'Fecha del gasto (YYYY-MM-DD)' })
  @Matches(DATE_ONLY, { message: 'expenseDate debe tener el formato YYYY-MM-DD' })
  expenseDate: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Si es CASH, descuenta del efectivo esperado del cierre',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;
}

export class UpdateExpenseDto extends PartialType(
  OmitType(RegisterExpenseDto, ['restaurantId'] as const),
) {}

export class ExpenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  categoryId: string;

  @ApiPropertyOptional({ nullable: true })
  inventoryMovementId: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ example: '2026-10-25' })
  expenseDate: string;

  @ApiPropertyOptional({ enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @ApiPropertyOptional({ nullable: true })
  registeredByUserId: string | null;

  @ApiProperty({ enum: ExpenseStatus })
  status: ExpenseStatus;

  @ApiProperty()
  createdAt: Date;

  static fromDomain(expense: Expense): ExpenseResponseDto {
    const dto = new ExpenseResponseDto();
    dto.id = expense.id;
    dto.restaurantId = expense.restaurantId;
    dto.categoryId = expense.categoryId;
    dto.inventoryMovementId = expense.inventoryMovementId;
    dto.description = expense.description;
    dto.amount = expense.amount;
    dto.expenseDate = expense.expenseDate;
    dto.paymentMethod = expense.paymentMethod;
    dto.registeredByUserId = expense.registeredByUserId;
    dto.status = expense.status;
    dto.createdAt = expense.createdAt;
    return dto;
  }
}

// ---------- daily closures ----------

export class CloseDayDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({
    example: '2026-10-25',
    description: 'Fecha comercial (zona horaria de la sede)',
  })
  @Matches(DATE_ONLY, { message: 'businessDate debe tener el formato YYYY-MM-DD' })
  businessDate: string;

  @ApiPropertyOptional({ example: 1250, description: 'Efectivo contado en caja' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualCash?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

class PaymentMethodTotalDto {
  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: 'Neto cobrado (pagos - reembolsos)' })
  amount: number;
}

export class ClosurePreviewResponseDto {
  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ example: '2026-10-25' })
  businessDate: string;

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

  @ApiProperty()
  netSales: number;

  @ApiProperty()
  expenseAmount: number;

  @ApiProperty({
    description: 'Efectivo cobrado - gastos pagados en efectivo (mínimo 0)',
  })
  expectedCash: number;

  @ApiProperty({ type: [PaymentMethodTotalDto] })
  paymentTotals: PaymentMethodTotalDto[];

  @ApiProperty({ description: 'Ya existe un cierre para esa fecha' })
  alreadyClosed: boolean;

  static fromPreview(preview: ClosurePreview): ClosurePreviewResponseDto {
    const dto = new ClosurePreviewResponseDto();
    dto.restaurantId = preview.restaurantId;
    dto.businessDate = preview.businessDate;
    dto.openedAttentions = preview.openedAttentions;
    dto.closedAttentions = preview.closedAttentions;
    dto.cancelledAttentions = preview.cancelledAttentions;
    dto.grossSales = preview.grossSales;
    dto.refundedAmount = preview.refundedAmount;
    dto.netSales = preview.netSales;
    dto.expenseAmount = preview.expenseAmount;
    dto.expectedCash = preview.expectedCash;
    dto.paymentTotals = preview.paymentTotals;
    dto.alreadyClosed = preview.alreadyClosed;
    return dto;
  }
}

export class DailyClosureResponseDto extends PickType(ClosurePreviewResponseDto, [
  'restaurantId',
  'businessDate',
  'openedAttentions',
  'closedAttentions',
  'cancelledAttentions',
  'grossSales',
  'refundedAmount',
  'netSales',
  'expenseAmount',
  'expectedCash',
  'paymentTotals',
] as const) {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  actualCash: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'actualCash - expectedCash' })
  differenceAmount: number | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty()
  closedByUserId: string;

  @ApiProperty()
  closedAt: Date;

  static fromDomain(closure: DailyClosure): DailyClosureResponseDto {
    const dto = new DailyClosureResponseDto();
    dto.id = closure.id;
    dto.restaurantId = closure.restaurantId;
    dto.businessDate = closure.businessDate;
    dto.openedAttentions = closure.openedAttentions;
    dto.closedAttentions = closure.closedAttentions;
    dto.cancelledAttentions = closure.cancelledAttentions;
    dto.grossSales = closure.grossSales;
    dto.refundedAmount = closure.refundedAmount;
    dto.netSales = closure.netSales;
    dto.expenseAmount = closure.expenseAmount;
    dto.expectedCash = closure.expectedCash;
    dto.paymentTotals = closure.paymentTotals;
    dto.actualCash = closure.actualCash;
    dto.differenceAmount = closure.differenceAmount;
    dto.notes = closure.notes;
    dto.closedByUserId = closure.closedByUserId;
    dto.closedAt = closure.closedAt;
    return dto;
  }
}
