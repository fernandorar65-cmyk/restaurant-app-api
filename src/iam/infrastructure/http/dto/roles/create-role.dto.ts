import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'WAITER', description: 'Único dentro de la organización' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code: string;

  @ApiProperty({ example: 'Mozo' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Toma pedidos en sala' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
