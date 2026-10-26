import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type {
  MovementResult,
  RestaurantSupplyView,
} from '../../../application/restaurant-supplies/restaurant-supplies.service.js';
import { InventoryMovement } from '../../../domain/entities/inventory-movement.entity.js';
import {
  MANUAL_MOVEMENT_TYPES,
  MovementTypeCode,
} from '../../../domain/enums/movement-type-code.enum.js';
import type { ManualMovementType } from '../../../domain/enums/movement-type-code.enum.js';

export class EnableRestaurantSupplyDto {
  @ApiProperty()
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ description: 'Insumo maestro de la misma organización' })
  @IsUUID()
  supplyId: string;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minimumQuantity?: number;
}

export class ConfigureRestaurantSupplyDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minimumQuantity?: number;

  @ApiPropertyOptional({ description: 'false = desactivar en la sede, true = reactivar' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class MovementAuthorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Repetir la misma clave devuelve el mismo movimiento' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  idempotencyKey?: string | null;
}

export class RegisterMovementDto extends MovementAuthorDto {
  @ApiProperty({ enum: MANUAL_MOVEMENT_TYPES })
  @IsIn(MANUAL_MOVEMENT_TYPES)
  type: ManualMovementType;

  @ApiProperty({ example: 10, description: 'Siempre positiva; el tipo define si suma o resta' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 4.5, description: 'Solo en compras: recalcula el costo promedio' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitCost?: number | null;
}

export class CountDto extends MovementAuthorDto {
  @ApiProperty({ example: 18, description: 'Cantidad realmente encontrada' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  countedQuantity: number;
}

export class ReverseMovementDto {
  @ApiProperty({ example: 'Compra registrada dos veces' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  notes: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  idempotencyKey?: string | null;
}

export class SupplySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ARROZ' })
  code: string;

  @ApiProperty({ example: 'Arroz' })
  name: string;

  @ApiProperty({ example: 'KG' })
  unitCode: string;
}

export class RestaurantSupplyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ type: SupplySummaryDto })
  supply: SupplySummaryDto;

  @ApiProperty()
  currentQuantity: number;

  @ApiProperty()
  minimumQuantity: number;

  @ApiProperty()
  averageUnitCost: number;

  @ApiProperty({ description: 'Alerta: el saldo llegó o bajó del mínimo' })
  lowStock: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromView({ restaurantSupply, supply }: RestaurantSupplyView): RestaurantSupplyResponseDto {
    const dto = new RestaurantSupplyResponseDto();
    dto.id = restaurantSupply.id;
    dto.restaurantId = restaurantSupply.restaurantId;
    dto.supply = { id: supply.id, code: supply.code, name: supply.name, unitCode: supply.unitCode };
    dto.currentQuantity = restaurantSupply.currentQuantity;
    dto.minimumQuantity = restaurantSupply.minimumQuantity;
    dto.averageUnitCost = restaurantSupply.averageUnitCost;
    dto.lowStock = restaurantSupply.isLowStock;
    dto.isActive = restaurantSupply.isActive;
    dto.createdAt = restaurantSupply.createdAt;
    dto.updatedAt = restaurantSupply.updatedAt;
    return dto;
  }
}

export class InventoryMovementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantSupplyId: string;

  @ApiProperty({ enum: MovementTypeCode })
  type: MovementTypeCode;

  @ApiProperty({ description: 'Positivo = entrada, negativo = salida' })
  quantityDelta: number;

  @ApiProperty()
  previousQuantity: number;

  @ApiProperty()
  resultingQuantity: number;

  @ApiPropertyOptional({ nullable: true, description: 'Solo en conteos' })
  countedQuantity: number | null;

  @ApiPropertyOptional({ nullable: true })
  unitCost: number | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ nullable: true })
  originModule: string | null;

  @ApiPropertyOptional({ nullable: true })
  originId: string | null;

  @ApiPropertyOptional({ nullable: true })
  idempotencyKey: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdByUserId: string | null;

  @ApiPropertyOptional({ nullable: true })
  reversalOfMovementId: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromDomain(movement: InventoryMovement): InventoryMovementResponseDto {
    const dto = new InventoryMovementResponseDto();
    dto.id = movement.id;
    dto.restaurantSupplyId = movement.restaurantSupplyId;
    dto.type = movement.type;
    dto.quantityDelta = movement.quantityDelta;
    dto.previousQuantity = movement.previousQuantity;
    dto.resultingQuantity = movement.resultingQuantity;
    dto.countedQuantity = movement.countedQuantity;
    dto.unitCost = movement.unitCost;
    dto.notes = movement.notes;
    dto.originModule = movement.originModule;
    dto.originId = movement.originId;
    dto.idempotencyKey = movement.idempotencyKey;
    dto.createdByUserId = movement.createdByUserId;
    dto.reversalOfMovementId = movement.reversalOfMovementId;
    dto.createdAt = movement.createdAt;
    return dto;
  }
}

export class MovementResultResponseDto {
  @ApiProperty({ type: RestaurantSupplyResponseDto })
  restaurantSupply: RestaurantSupplyResponseDto;

  @ApiPropertyOptional({
    type: InventoryMovementResponseDto,
    nullable: true,
    description: 'null si el conteo coincidió con el saldo registrado',
  })
  movement: InventoryMovementResponseDto | null;

  static from(result: MovementResult): MovementResultResponseDto {
    const dto = new MovementResultResponseDto();
    dto.restaurantSupply = RestaurantSupplyResponseDto.fromView(result.view);
    dto.movement = result.movement ? InventoryMovementResponseDto.fromDomain(result.movement) : null;
    return dto;
  }
}
