import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from './user.entity.js';

export class AuthSession {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  accessToken: string;

  @ApiProperty({ type: AuthUser })
  user: AuthUser;
}
