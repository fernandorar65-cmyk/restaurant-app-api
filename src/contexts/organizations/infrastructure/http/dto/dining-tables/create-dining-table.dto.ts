import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DiningTableStatus } from '../../../../domain/entities/dining-table.entity.js';

export class CreateDiningTableDto {
  @ApiProperty({ example: 'A1' })
  @IsString()
  tableNumber: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ enum: DiningTableStatus })
  @IsOptional()
  @IsEnum(DiningTableStatus)
  status?: DiningTableStatus;

  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;
}
