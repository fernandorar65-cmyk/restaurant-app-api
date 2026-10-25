import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePermissionDto } from './create-permission.dto.js';

export class UpdatePermissionDto extends PartialType(
  OmitType(CreatePermissionDto, ['code'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
