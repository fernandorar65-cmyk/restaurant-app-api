import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Categorías de la organización de la sede (puede tener varias o ninguna)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @ApiProperty({ example: 'CEV-01', description: 'Único dentro del restaurante' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Ceviche clásico' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Pescado fresco marinado en limón' })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/ceviche.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  imageUrl?: string | null;

  @ApiProperty({ example: 32.5, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  preparationMinutes?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTakeawayAllowed?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isDeliveryAllowed?: boolean;
}
