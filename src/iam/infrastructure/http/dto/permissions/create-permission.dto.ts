import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'orders.manage' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Gestionar pedidos' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
