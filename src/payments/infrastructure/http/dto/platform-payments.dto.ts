import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaymentStatus } from '../../../domain/entities/payment-status.entity.js';
import { ProviderEvent } from '../../../domain/entities/provider-event.entity.js';
import { ProviderStatusMapping } from '../../../domain/entities/provider-status-mapping.entity.js';
import { PaymentStatusCode } from '../../../domain/enums/payment-status-code.enum.js';
import { ProviderEventResult } from '../../../domain/enums/provider-event-result.enum.js';

export class RenamePaymentStatusDto {
  @ApiPropertyOptional({ example: 'Pagado' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class PaymentStatusResponseDto {
  @ApiProperty({ enum: PaymentStatusCode, description: 'Código estable e inmutable' })
  code: PaymentStatusCode;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isTerminal: boolean;

  @ApiProperty({ description: 'Si reduce el saldo de la atención' })
  countsTowardBalance: boolean;

  @ApiProperty()
  allowsRefund: boolean;

  @ApiProperty()
  isActive: boolean;

  static fromDomain(status: PaymentStatus): PaymentStatusResponseDto {
    const dto = new PaymentStatusResponseDto();
    dto.code = status.code;
    dto.name = status.name;
    dto.description = status.description;
    dto.isTerminal = status.isTerminal;
    dto.countsTowardBalance = status.countsTowardBalance;
    dto.allowsRefund = status.allowsRefund;
    dto.isActive = status.isActive;
    return dto;
  }
}

export class CreateProviderStatusMappingDto {
  @ApiProperty({ example: 'mercado_pago' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  providerCode: string;

  @ApiProperty({ example: 'approved', description: 'Estado tal como lo envía la pasarela' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  externalStatus: string;

  @ApiProperty({ enum: PaymentStatusCode })
  @IsEnum(PaymentStatusCode)
  paymentStatus: PaymentStatusCode;
}

export class UpdateProviderStatusMappingDto {
  @ApiPropertyOptional({ enum: PaymentStatusCode })
  @IsOptional()
  @IsEnum(PaymentStatusCode)
  paymentStatus?: PaymentStatusCode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProviderStatusMappingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  providerCode: string;

  @ApiProperty()
  externalStatus: string;

  @ApiProperty({ enum: PaymentStatusCode })
  paymentStatus: PaymentStatusCode;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(mapping: ProviderStatusMapping): ProviderStatusMappingResponseDto {
    const dto = new ProviderStatusMappingResponseDto();
    dto.id = mapping.id;
    dto.providerCode = mapping.providerCode;
    dto.externalStatus = mapping.externalStatus;
    dto.paymentStatus = mapping.paymentStatus;
    dto.isActive = mapping.isActive;
    dto.createdAt = mapping.createdAt;
    dto.updatedAt = mapping.updatedAt;
    return dto;
  }
}

export class ProviderEventDto {
  @ApiProperty({ description: 'Identificador único del evento en la pasarela' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  eventId: string;

  @ApiProperty({ example: 'payment.updated' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  eventType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  providerPaymentId?: string | null;

  @ApiPropertyOptional({ example: 'approved' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalStatus?: string | null;

  @ApiPropertyOptional({ description: 'Payload original (los datos de tarjeta se eliminan)' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class ProviderEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  providerCode: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  eventType: string;

  @ApiPropertyOptional({ nullable: true })
  providerPaymentId: string | null;

  @ApiPropertyOptional({ nullable: true })
  externalStatus: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentId: string | null;

  @ApiProperty()
  payload: Record<string, unknown>;

  @ApiProperty()
  receivedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  processedAt: Date | null;

  @ApiPropertyOptional({ enum: ProviderEventResult, nullable: true })
  result: ProviderEventResult | null;

  @ApiPropertyOptional({ nullable: true })
  resultMessage: string | null;

  @ApiProperty({ description: 'true si el evento ya se había recibido (no se volvió a aplicar)' })
  duplicate: boolean;

  static fromDomain(event: ProviderEvent, duplicate = false): ProviderEventResponseDto {
    const dto = new ProviderEventResponseDto();
    dto.id = event.id;
    dto.providerCode = event.providerCode;
    dto.eventId = event.eventId;
    dto.eventType = event.eventType;
    dto.providerPaymentId = event.providerPaymentId;
    dto.externalStatus = event.externalStatus;
    dto.paymentId = event.paymentId;
    dto.payload = event.payload;
    dto.receivedAt = event.receivedAt;
    dto.processedAt = event.processedAt;
    dto.result = event.result;
    dto.resultMessage = event.resultMessage;
    dto.duplicate = duplicate;
    return dto;
  }
}
