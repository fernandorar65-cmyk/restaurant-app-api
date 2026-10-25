import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ example: 'Carta principal' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00-05:00' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59-05:00' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date | null;
}
