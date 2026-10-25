import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '../../../../domain/enums/user-status.enum.js';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['mustChangePassword'] as const),
) {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
