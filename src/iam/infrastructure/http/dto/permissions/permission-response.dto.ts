import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Permission } from '../../../../domain/entities/permission.entity.js';

export class PermissionResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'orders:create' })
  name: string;

  @ApiPropertyOptional({ example: 'Permite crear órdenes' })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(permission: Permission): PermissionResponseDto {
    const dto = new PermissionResponseDto();
    dto.id = permission.id;
    dto.name = permission.name;
    dto.description = permission.description;
    dto.createdAt = permission.createdAt;
    dto.updatedAt = permission.updatedAt;
    return dto;
  }
}
