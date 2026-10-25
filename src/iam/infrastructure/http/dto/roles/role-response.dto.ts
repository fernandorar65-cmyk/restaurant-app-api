import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../../domain/entities/role.entity.js';

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ example: 'WAITER' })
  code: string;

  @ApiProperty({ example: 'Mozo' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(role: Role): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.id = role.id;
    dto.organizationId = role.organizationId;
    dto.code = role.code;
    dto.name = role.name;
    dto.description = role.description;
    dto.isSystem = role.isSystem;
    dto.isActive = role.isActive;
    dto.createdAt = role.createdAt;
    dto.updatedAt = role.updatedAt;
    return dto;
  }
}
