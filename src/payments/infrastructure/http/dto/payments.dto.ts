import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../../../common/domain/payment-method.enum.js';
import type {
  AttentionBalance,
  ChargeLineBalance,
} from '../../../application/payments/payments.service.js';
import { Payment } from '../../../domain/entities/payment.entity.js';
import type { PaymentAllocation } from '../../../domain/entities/payment.entity.js';
import { AllocationConcept } from '../../../domain/enums/allocation-concept.enum.js';
import { AllocationMode } from '../../../domain/enums/allocation-mode.enum.js';
import { PaymentStatusCode } from '../../../domain/enums/payment-status-code.enum.js';

export class RequestedAllocationDto {
  @ApiPropertyOptional({ description: 'Producto a pagar; omitirlo para pagar el costo de envío' })
  @IsOptional()
  @IsUUID()
  orderItemId?: string | null;

  @ApiProperty({ example: 40 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class ProviderDataDto {
  @ApiProperty({ example: 'mercado_pago' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Identificador del pago en la pasarela' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentId?: string | null;

  @ApiPropertyOptional({ example: 'approved', description: 'Estado original informado por la pasarela' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string | null;
}

export class RegisterPaymentDto {
  @ApiProperty()
  @IsUUID()
  attentionId: string;

  @ApiProperty({ description: 'UUID generado por el cliente. Reenviarlo devuelve el mismo pago' })
  @IsUUID()
  requestId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    enum: AllocationMode,
    description:
      'FULL: todo el saldo. AMOUNT: un monto libre (se reparte automáticamente). ITEMS: productos y montos elegidos',
  })
  @IsEnum(AllocationMode)
  mode: AllocationMode;

  @ApiPropertyOptional({ example: 45, description: 'Solo para AMOUNT' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ type: [RequestedAllocationDto], description: 'Solo para ITEMS' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => RequestedAllocationDto)
  allocations?: RequestedAllocationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  payerUserId?: string | null;

  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  payerName?: string | null;

  @ApiPropertyOptional({ description: 'Referencia manual, p. ej. número de operación Yape' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalReference?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({
    type: ProviderDataDto,
    description: 'Solo si interviene una pasarela; sin esto el pago queda PAID',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderDataDto)
  provider?: ProviderDataDto;
}

export class AllocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AllocationConcept })
  concept: AllocationConcept;

  @ApiPropertyOptional({ nullable: true })
  orderItemId: string | null;

  @ApiProperty()
  amount: number;

  static fromDomain(allocation: PaymentAllocation): AllocationResponseDto {
    const dto = new AllocationResponseDto();
    dto.id = allocation.id;
    dto.concept = allocation.concept;
    dto.orderItemId = allocation.orderItemId;
    dto.amount = allocation.amount;
    return dto;
  }
}

export class ProviderResponseDto {
  @ApiProperty()
  code: string;

  @ApiPropertyOptional({ nullable: true })
  paymentId: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Último estado original de la pasarela' })
  status: string | null;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  attentionId: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ enum: PaymentStatusCode, description: 'Estado interno de ACMR' })
  status: PaymentStatusCode;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ enum: AllocationMode })
  mode: AllocationMode;

  @ApiProperty()
  amount: number;

  @ApiProperty({ example: 'PEN' })
  currencyCode: string;

  @ApiPropertyOptional({ nullable: true })
  payerUserId: string | null;

  @ApiPropertyOptional({ nullable: true })
  payerName: string | null;

  @ApiPropertyOptional({ nullable: true })
  externalReference: string | null;

  @ApiPropertyOptional({ type: ProviderResponseDto, nullable: true })
  provider: ProviderResponseDto | null;

  @ApiProperty()
  requestId: string;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  registeredByUserId: string | null;

  @ApiProperty({ type: [AllocationResponseDto] })
  allocations: AllocationResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id;
    dto.attentionId = payment.attentionId;
    dto.restaurantId = payment.restaurantId;
    dto.status = payment.status;
    dto.method = payment.method;
    dto.mode = payment.mode;
    dto.amount = payment.amount;
    dto.currencyCode = payment.currencyCode;
    dto.payerUserId = payment.payerUserId;
    dto.payerName = payment.payerName;
    dto.externalReference = payment.externalReference;
    dto.provider = payment.provider ? { ...payment.provider } : null;
    dto.requestId = payment.requestId;
    dto.notes = payment.notes;
    dto.paidAt = payment.paidAt;
    dto.registeredByUserId = payment.registeredByUserId;
    dto.allocations = payment.allocations.map((allocation) =>
      AllocationResponseDto.fromDomain(allocation),
    );
    dto.createdAt = payment.createdAt;
    dto.updatedAt = payment.updatedAt;
    return dto;
  }
}

export class ChargeLineBalanceDto {
  @ApiProperty({ enum: AllocationConcept })
  concept: AllocationConcept;

  @ApiPropertyOptional({ nullable: true })
  orderItemId: string | null;

  @ApiProperty({ example: '"Lomo saltado"' })
  label: string;

  @ApiProperty()
  total: number;

  @ApiProperty({ description: 'Cubierto por pagos confirmados' })
  paid: number;

  @ApiProperty({ description: 'Reservado por pagos pendientes en una pasarela' })
  reserved: number;

  @ApiProperty()
  outstanding: number;

  static from(line: ChargeLineBalance): ChargeLineBalanceDto {
    return Object.assign(new ChargeLineBalanceDto(), line);
  }
}

export class AttentionBalanceDto {
  @ApiProperty()
  attentionId: string;

  @ApiProperty()
  currencyCode: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  reserved: number;

  @ApiProperty()
  outstanding: number;

  @ApiProperty({ type: [ChargeLineBalanceDto] })
  lines: ChargeLineBalanceDto[];

  static from(balance: AttentionBalance): AttentionBalanceDto {
    const dto = Object.assign(new AttentionBalanceDto(), balance);
    dto.lines = balance.lines.map((line) => ChargeLineBalanceDto.from(line));
    return dto;
  }
}
