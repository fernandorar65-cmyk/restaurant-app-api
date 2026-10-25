import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRoleDto } from './create-role.dto.js';

export class UpdateRoleDto extends PartialType(
  PickType(CreateRoleDto, ['name', 'description'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
