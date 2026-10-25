import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRolePermissionDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ example: '7c1e6f2a-2222-4b3a-9a1a-9f3b2c1d4e5f' })
  @IsUUID()
  permissionId: string;
}
