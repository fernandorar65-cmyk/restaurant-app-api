import { ApiProperty } from '@nestjs/swagger';
import type { AuthTokens } from '../../../../application/auth/auth.service.js';
import { User } from '../../../../domain/entities/user.entity.js';
import { UserResponseDto } from '../users/user-response.dto.js';

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class AuthResponseDto extends AuthTokensResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  static fromDomain(user: User, tokens: AuthTokens): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = tokens.accessToken;
    dto.refreshToken = tokens.refreshToken;
    dto.user = UserResponseDto.fromDomain(user);
    return dto;
  }
}
