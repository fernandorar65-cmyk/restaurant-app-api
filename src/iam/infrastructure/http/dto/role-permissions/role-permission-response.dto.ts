import { ApiProperty } from '@nestjs/swagger';
import { RolePermission } from '../../../../domain/entities/role-permission.entity.js';

export class RolePermissionResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  permissionId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(rolePermission: RolePermission): RolePermissionResponseDto {
    const dto = new RolePermissionResponseDto();
    dto.id = rolePermission.id;
    dto.roleId = rolePermission.roleId;
    dto.permissionId = rolePermission.permissionId;
    dto.createdAt = rolePermission.createdAt;
    dto.updatedAt = rolePermission.updatedAt;
    return dto;
  }
}
