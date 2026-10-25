import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Sabores Miraflores', minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'MIRAFLORES',
    description: 'Único dentro de la organización. Se genera a partir del slug si no se envía',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    example: 'sabores-miraflores',
    description: 'Se genera a partir del nombre si no se envía',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: 'Av. Larco 123, Miraflores' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @ApiPropertyOptional({ example: '+51 1 234 5678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'miraflores@sabores.pe' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: -12.1211 })
  @IsOptional()
  @IsLatitude()
  latitude?: number | null;

  @ApiPropertyOptional({ example: -77.0297 })
  @IsOptional()
  @IsLongitude()
  longitude?: number | null;

  @ApiPropertyOptional({ example: 'PEN', description: 'Por defecto, la de la organización' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'America/Lima', description: 'Por defecto, la de la organización' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
