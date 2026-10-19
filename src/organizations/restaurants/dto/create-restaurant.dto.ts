import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Restaurante Centro', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Av. Reforma 123, CDMX' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+52 55 8765 4321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;
}
