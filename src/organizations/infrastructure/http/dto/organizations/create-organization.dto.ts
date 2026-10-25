import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Grupo Sabores', minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Grupo Sabores S.A.C.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string | null;

  @ApiPropertyOptional({ example: '20601234567', description: 'RUC u otro identificador fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxIdentifier?: string | null;

  @ApiPropertyOptional({ example: 'PEN', default: 'PEN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'America/Lima', default: 'America/Lima' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
