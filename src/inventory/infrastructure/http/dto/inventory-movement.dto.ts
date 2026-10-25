import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { InventoryMovement } from '../../../domain/entities/inventory-movement.entity.js';
import type { AdjustmentDirection } from '../../../domain/entities/supply.entity.js';
import { InventoryMovementType } from '../../../domain/enums/inventory-movement-type.enum.js';

const DIRECTIONS: AdjustmentDirection[] = ['INCREASE', 'DECREASE'];

export class RegisterMovementDto {
  @ApiProperty({
    enum: InventoryMovementType,
    description:
      'PURCHASE suma, USAGE/WASTE restan, COUNT fija el stock contado, ADJUSTMENT suma o resta según direction',
  })
  @IsEnum(InventoryMovementType)
  type: InventoryMovementType;

  @ApiPropertyOptional({ example: 2.5, description: 'Requerido salvo en COUNT' })
  @ValidateIf((dto: RegisterMovementDto) => dto.type !== InventoryMovementType.COUNT)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @ApiPropertyOptional({ example: 4.8, description: 'Costo unitario (PURCHASE)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitCost?: number | null;

  @ApiPropertyOptional({ example: 12, description: 'Requerido en COUNT' })
  @ValidateIf((dto: RegisterMovementDto) => dto.type === InventoryMovementType.COUNT)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  countedQuantity?: number;

  @ApiPropertyOptional({ enum: DIRECTIONS, description: 'Requerido en ADJUSTMENT' })
  @ValidateIf(
    (dto: RegisterMovementDto) => dto.type === InventoryMovementType.ADJUSTMENT,
  )
  @IsIn(DIRECTIONS)
  direction?: AdjustmentDirection;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Usuario responsable' })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string | null;
}

export class InventoryMovementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  supplyId: string;

  @ApiProperty({ enum: InventoryMovementType })
  movementType: InventoryMovementType;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional({ nullable: true })
  unitCost: number | null;

  @ApiProperty()
  previousQuantity: number;

  @ApiProperty()
  resultingQuantity: number;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdByUserId: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromDomain(movement: InventoryMovement): InventoryMovementResponseDto {
    const dto = new InventoryMovementResponseDto();
    dto.id = movement.id;
    dto.supplyId = movement.supplyId;
    dto.movementType = movement.movementType;
    dto.quantity = movement.quantity;
    dto.unitCost = movement.unitCost;
    dto.previousQuantity = movement.previousQuantity;
    dto.resultingQuantity = movement.resultingQuantity;
    dto.notes = movement.notes;
    dto.createdByUserId = movement.createdByUserId;
    dto.createdAt = movement.createdAt;
    return dto;
  }
}
