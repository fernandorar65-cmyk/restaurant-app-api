import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({ example: '7c1e6f2a-2222-4b3a-9a1a-9f3b2c1d4e5f' })
  @IsUUID()
  permissionId: string;
}
