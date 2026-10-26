import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class CreateEmployeeDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'Usuario con acceso al sistema. Omitir si el empleado no tiene acceso',
  })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiProperty({ example: 'EMP-001', description: 'Único dentro de la organización' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeCode: string;

  @ApiPropertyOptional({ example: '70123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentNumber?: string | null;

  @ApiPropertyOptional({
    description:
      'Puesto vigente (de la misma organización y activo). El área se obtiene del puesto',
  })
  @IsOptional()
  @IsUUID()
  jobPositionId?: string | null;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'hiredAt debe tener el formato YYYY-MM-DD' })
  hiredAt?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'terminatedAt debe tener el formato YYYY-MM-DD' })
  terminatedAt?: string | null;
}
