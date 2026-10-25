import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../../domain/entities/user.entity.js';
import type { AuthTokens } from '../../../../application/auth/staff-auth.service.js';
import { UserResponseDto } from '../users/user-response.dto.js';

export class StaffAuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  static fromDomain(user: User, tokens: AuthTokens): StaffAuthResponseDto {
    const dto = new StaffAuthResponseDto();
    dto.accessToken = tokens.accessToken;
    dto.refreshToken = tokens.refreshToken;
    dto.user = UserResponseDto.fromDomain(user);
    return dto;
  }
}
