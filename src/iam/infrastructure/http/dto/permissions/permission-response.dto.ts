import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Permission } from '../../../../domain/entities/permission.entity.js';

export class PermissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'orders.manage' })
  code: string;

  @ApiProperty({ example: 'Gestionar pedidos' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(permission: Permission): PermissionResponseDto {
    const dto = new PermissionResponseDto();
    dto.id = permission.id;
    dto.code = permission.code;
    dto.name = permission.name;
    dto.description = permission.description;
    dto.isActive = permission.isActive;
    dto.createdAt = permission.createdAt;
    dto.updatedAt = permission.updatedAt;
    return dto;
  }
}
