import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDiningTableDto {
  @ApiProperty({
    example: '424590bf-8d98-41c3-8ab9-e50440292401',
    description: 'Piso de la mesa; el restaurante se toma del piso',
  })
  @IsUUID()
  floorId: string;

  @ApiProperty({ example: 'M01', description: 'Único dentro del restaurante' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Mesa 1' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @ApiPropertyOptional({ example: 120.5, description: 'Posición en el plano del piso' })
  @IsOptional()
  @IsNumber()
  positionX?: number | null;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  positionY?: number | null;
}
