import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Rol de la misma organización' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({
    default: false,
    description: 'true = acceso a todas las sedes (actuales y futuras)',
  })
  @IsOptional()
  @IsBoolean()
  allRestaurants?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Sedes permitidas cuando allRestaurants es false. Lista vacía = sin acceso a sedes',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  restaurantIds?: string[];
}
