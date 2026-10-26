import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { RestaurantOrderMode } from '../../../../domain/entities/restaurant-order-mode.entity.js';
import { OrderMode } from '../../../../domain/enums/order-mode.enum.js';

export class ConfigureOrderModeDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: 30, description: 'Monto mínimo del pedido' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumAmount?: number | null;

  @ApiPropertyOptional({ example: 7.5, description: 'Solo DELIVERY' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee?: number | null;

  @ApiPropertyOptional({
    example: { radiusKm: 5 },
    description: 'Configuración libre (radio de reparto, horarios, ...)',
  })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

export class RestaurantOrderModeResponseDto {
  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ enum: OrderMode })
  mode: OrderMode;

  @ApiProperty()
  isEnabled: boolean;

  @ApiPropertyOptional({ nullable: true })
  minimumAmount: number | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryFee: number | null;

  @ApiProperty()
  configuration: Record<string, unknown>;

  static fromDomain(orderMode: RestaurantOrderMode): RestaurantOrderModeResponseDto {
    const dto = new RestaurantOrderModeResponseDto();
    dto.restaurantId = orderMode.restaurantId;
    dto.mode = orderMode.mode;
    dto.isEnabled = orderMode.isEnabled;
    dto.minimumAmount = orderMode.minimumAmount;
    dto.deliveryFee = orderMode.deliveryFee;
    dto.configuration = orderMode.configuration;
    return dto;
  }
}
